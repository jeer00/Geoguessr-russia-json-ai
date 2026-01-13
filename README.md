# 📡 Russia Coverage AI Analyzer

AI-powered visualization tool using **Next.js**, **PostGIS/postgresql**, and **Gemini API**.

## 📂 Project Structure
- `app/`: Next.js frontend & API.
- `db/`: Docker, SQL init, and Ingest script.

---

## 🛠 1. Database Setup (Docker)
```bash
cd db
docker-compose up -d
cp example.env .env
npx ts-node ingest.ts
```

---
## 🛠 2. Frontend Setup
```bash
cd app
npm install
```

### 2.1 Environment Variables
Copy the example environment file and update the variables:
```bash
cp example.env .env
```

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | API key for Gemini |
| `HF_TOKEN` | API key for Huggingface |
| `NEXT_PUBLIC_MAPS_API_KEY` | API key for Google Maps |
| `DATABASE_URL` | PostgreSQL connection string |

### 2.2 Run the app
```bash
npm run dev
```
