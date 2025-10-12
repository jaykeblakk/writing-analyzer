# Writing Analyzer Backend

Node.js/Express API for analyzing writing documents and storing results.

## Setup

```bash
cd backend
npm install
cp env.example .env
```

## Run Locally

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will run on `http://localhost:3001`

## API Endpoints

### `POST /api/analyze`
Upload and analyze a document.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (document to analyze)

**Response:**
```json
{
  "success": true,
  "analysis": { ... current analysis ... },
  "previousAnalysis": { ... previous analysis or null ... }
}
```

### `GET /api/history/:filename`
Get the most recent previous analysis for a file.

**Response:**
```json
{
  "success": true,
  "analysis": { ... }
}
```

### `GET /health`
Health check endpoint.

## Database

By default, uses in-memory storage for local development.

For AWS deployment with PostgreSQL:
1. Set `DATABASE_URL` in `.env`
2. Database table will be created automatically on startup

## Environment Variables

See `env.example` for configuration options.

