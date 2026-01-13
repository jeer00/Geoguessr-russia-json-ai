import json
import os
import psycopg2
from psycopg2.extras import execute_values
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import torch

load_dotenv()

device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = SentenceTransformer('intfloat/e5-large-v2', device=device)

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

def run_ingest():
    files = ['./russia_gen4.json', './russia_short_antenna.json']
    batch_size = 256 

    for file_path in files:
        if not os.path.exists(file_path):
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        points = data.get('customCoordinates', [])
        name = data.get('name', 'Unknown')
        total_points = len(points)

        for i in range(0, total_points, batch_size):
            batch = points[i:i + batch_size]
            texts = [f"passage: {name} {' '.join(p.get('extra', {}).get('tags', []))}" for p in batch]
            embeddings = model.encode(texts, batch_size=len(batch), show_progress_bar=False)

            data_to_insert = []
            for j, p in enumerate(batch):
                data_to_insert.append((
                    name,
                    p['lng'],
                    p['lat'],
                    p.get('extra', {}).get('tags', []),
                    embeddings[j].tolist(),
                    json.dumps(p)
                ))

            query = "INSERT INTO coverage_points (name, location, tags, embedding, raw_data) VALUES %s"
            template = "(%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s)"

            try:
                execute_values(cur, query, data_to_insert, template=template)
                conn.commit()
            except Exception:
                conn.rollback()

    cur.close()
    conn.close()

if __name__ == "__main__":
    run_ingest()