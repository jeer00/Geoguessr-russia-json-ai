import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from 'pg';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
console.log(req.body);
  const { prompt } = req.body;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();

    const tagRes = await client.query("SELECT DISTINCT unnest(tags) as tag FROM coverage_points");
    const availableTags = tagRes.rows.map(r => r.tag);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const systemPrompt = `ACT AS A GEOGRAPHIC SEARCH ENGINE. 
    AVAILABLE TAGS: [${availableTags.join(", ")}].
    Return ONLY JSON: {"city": string | null, "tags": string[]}. Query: ${prompt}`;

    const aiRes = await model.generateContent(systemPrompt);
    const intent = JSON.parse(aiRes.response.text().replace(/```json|```/g, "").trim());

    let coords = null;
    if (intent.city) {
      const geo = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(intent.city)}`, {
        headers: { 'User-Agent': 'MapApp/1.0' }
      });
      if (geo.data?.[0]) coords = { lat: parseFloat(geo.data[0].lat), lon: parseFloat(geo.data[0].lon) };
    }

    const sql = coords 
      ? `SELECT name, tags, ST_AsText(location) as pos FROM coverage_points WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100000) AND tags && $3 LIMIT 50`
      : `SELECT name, tags, ST_AsText(location) as pos FROM coverage_points WHERE tags && $1 LIMIT 50`;

    const params = coords ? [coords.lon, coords.lat, intent.tags] : [intent.tags];
    const dbRes = await client.query(sql, params);
    console.log(dbRes.rows);
    res.status(200).json({ intent, results: dbRes.rows });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
}