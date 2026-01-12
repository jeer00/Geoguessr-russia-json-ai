import { Client } from 'pg';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/map_ai"
});

async function runIngest() {
    const files = ['./russia_gen4.json', './russia_short_antenna.json'];
    await client.connect();

    try {
        for (const file of files) {
            console.log(`Processing ${file}...`);
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));

          
            await client.query('BEGIN');
            
            for (const coord of data.customCoordinates) {
                const query = `
                    INSERT INTO coverage_points (name, location, tags, raw_data)
                    VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)
                `;
                // lng (longitud) first
                await client.query(query, [
                    data.name, 
                    coord.lng, 
                    coord.lat, 
                    coord.extra.tags, 
                    JSON.stringify(coord)
                ]);
            }
            
            await client.query('COMMIT');
            console.log(`Finished ${file}`);
        }
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error during ingest:", e);
    } finally {
        await client.end();
    }
}

runIngest();