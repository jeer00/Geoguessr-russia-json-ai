CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS coverage_points (
    id SERIAL PRIMARY KEY,
    name TEXT,
    location GEOGRAPHY(POINT, 4326),
    tags TEXT[],
    embedding vector(1024), 
    raw_data JSONB
);

CREATE INDEX ON coverage_points USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_location_gist ON coverage_points USING GIST (location);