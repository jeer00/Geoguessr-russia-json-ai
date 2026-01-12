CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS coverage_points (
    id SERIAL PRIMARY KEY,
    name TEXT,
    location GEOGRAPHY(POINT, 4326),
    tags TEXT[],
    raw_data JSONB
);

CREATE INDEX idx_spatial_location ON coverage_points USING GIST(location);
CREATE INDEX idx_tags ON coverage_points USING GIN(tags);