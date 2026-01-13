import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { InferenceClient } from "@huggingface/inference";
import { Client } from 'pg';
import axios from 'axios';

const hf = new InferenceClient(process.env.HF_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const HF_MODEL = "intfloat/e5-large-v2";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();

    // 1. ANALYZE INTENT (GEMINI)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const systemPrompt = `ACT AS A GEOGRAPHIC SEARCH ANALYST. 
    Analyze the user query and return ONLY JSON: {"city": string | null, "search_term": string}. 
    Translate intent into a descriptive search term for a vector embedding model.
    Query: ${prompt}`;

    const aiRes = await model.generateContent(systemPrompt);
    const intent = JSON.parse(aiRes.response.text().replace(/```json|```/g, "").trim());

    // 2. GENERATE EMBEDDINGS (HUGGING FACE)
    const embeddingResponse = await hf.featureExtraction({
      model: HF_MODEL,
      inputs: `query: ${intent.search_term}`,
    });

    let embedding = embeddingResponse as any;
    while (Array.isArray(embedding[0])) {
      embedding = embedding[0];
    }

    // 3. GEOCODING (NOMINATIM)
    let coords = null;
    if (intent.city) {
      try {
        const geo = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(intent.city)}&accept-language=en`, 
          { headers: { 'User-Agent': 'MapSearchApp/1.0' } }
        );
        
        if (geo.data?.[0]) {
          coords = { 
            lat: parseFloat(geo.data[0].lat), 
            lon: parseFloat(geo.data[0].lon) 
          };
        }
      } catch (geoErr) {
        console.error("Geocoding failed:", geoErr.message);
      }
    }

    // 4. HYBRID VECTOR SEARCH (POSTGRES)
    const sql = `
      SELECT 
        name, 
        tags, 
        ST_AsGeoJSON(location)::json as pos,
        raw_data->>'extra' as extra_info,
        1 - (embedding <=> $1::vector) as similarity
      FROM coverage_points 
      WHERE 1 - (embedding <=> $1::vector) > 0.1
      ${coords ? 'AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 150000)' : ''}
      ORDER BY similarity DESC
      LIMIT 50
    `;

    const params = coords 
      ? [JSON.stringify(embedding), coords.lon, coords.lat] 
      : [JSON.stringify(embedding)];

    const dbRes = await client.query(sql, params);
    console.log(`Search for "${intent.search_term}" returned ${dbRes.rows.length} results.`);

    res.status(200).json({ 
      intent, 
      results: dbRes.rows,
      center: coords
    });

  } catch (error: any) {
    console.error("Critical API Error:", error.message);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  } finally {
    await client.end().catch(err => console.error("Error closing DB:", err.message));
  }
}