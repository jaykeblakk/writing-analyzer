# Architecture & Code Walkthrough

This document explains the application architecture and walks through the code step by step.

## Overview

The Writing Analyzer is a full-stack application with:
- **Frontend**: React 19 + TypeScript + Vite (modern, fast build tool)
- **File Processing**: Client-side PDF text extraction (`pdfjs-dist`) and writing analysis (`analyzeWriting.ts`) in the browser
- **Backend**: Node.js + Express 5 (RESTful API for saving stats and computing comparisons)
- **Database**: AWS RDS PostgreSQL (relational database with snapshot support) or automatic in-memory fallback when no database is configured

---

## Backend Architecture (`backend/server.js`)

### Step 1: Server Setup and Configuration

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getPreviousUpload, saveUpload } from './database.js';
```

**What this does:**
- Uses ES6 modules (modern JavaScript)
- `express`: Web server framework (Express 5)
- `cors`: Allows frontend to make requests (Cross-Origin Resource Sharing)
- `pg`: PostgreSQL client library for database operations (in `database.js`)

### Step 2: Database Configuration & Fallback (`backend/database.js`)

```javascript
import pg from 'pg';
const { Pool } = pg;

if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'writing_analyzer',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}
```

**What this does:**
- Creates a PostgreSQL connection pool when `DB_HOST`, `DB_USER`, and `DB_PASSWORD` are set
- Automatically falls back to in-memory storage (`latestUpload`) when database credentials are omitted
- Supports SSL connections for RDS

### Step 3: Database Functions (`backend/database.js`)

**`initializeDatabase()`:**
- Connects to PostgreSQL and creates the `writing_uploads` table if configured, or initializes in-memory mode
- Called automatically on server startup before listening on `PORT`

**`getPreviousUpload()`:**
- Queries PostgreSQL (or reads `latestUpload` in memory) for the stored upload (only one row exists)
- Returns the previous upload's statistics for comparison, or `null` if none exists

**`saveUpload(stats)`:**
- Deletes any existing row (`DELETE FROM writing_uploads`), then inserts the new statistics (or overwrites `latestUpload` in memory)
- Only the most recent upload is kept
- Minimizes storage for cost-effective snapshot workflow
- Returns the created timestamp

### Step 4: API Endpoints (`backend/server.js`)

**`POST /api/stats`:**
1. Receives pre-computed `{ stats }` JSON payload from the frontend
2. Fetches previous upload via `getPreviousUpload()`
3. Saves current stats via `saveUpload(stats)` (replaces previous upload)
4. Calculates differences (`current - previous`) for word, sentence, character, and paragraph counts
5. Returns JSON response with `stats`, `differences`, and `previousUpload` summary

**`GET /api/health`:**
- Returns `{ status: 'ok' }` for health checks

---

## Frontend Architecture

### Component Structure

```
App.tsx (Main Container)
├── FileUpload.tsx (Browser PDF extraction via pdfjs-dist + POST /api/stats)
│   └── utils/analyzeWriting.ts (Computes writing statistics from extracted text)
├── StatsDisplay.tsx (Shows statistics with comparisons)
└── ProgressBar.tsx (100k word progress visualization)
```

### Step 1: App Component (`App.tsx`)

**State Management:**
- `analysisResult`: Stores the complete analysis result
- `loading`: Shows loading spinner during processing
- `error`: Displays error messages

**What it does:**
- Orchestrates the entire UI
- Passes callbacks to child components
- Conditionally renders components based on state

### Step 2: FileUpload Component (`FileUpload.tsx`) & Analysis (`utils/analyzeWriting.ts`)

**Key Features:**
- Hidden file input (styled upload area)
- File validation (PDF only, 50MB size limit)
- Extracts PDF text directly in the browser using `pdfjs-dist` (worker loaded from unpkg CDN to avoid `.mjs` MIME issues)
- Reconstructs line and paragraph breaks using PDF text item Y-coordinate gaps (`transform[5]`)
- Runs `analyzeWriting(text)` to compute word, sentence, paragraph, and character metrics
- Sends computed stats JSON to `POST /api/stats`

**Process:**
1. User selects a PDF file
2. Validates file type (`application/pdf`) and size ($\le$ 50MB)
3. Reads file into `Uint8Array` and parses pages with `pdfjsLib.getDocument`
4. Computes statistics via `analyzeWriting(text)`
5. Sends `POST /api/stats` with `{ stats }`
6. Calls `onAnalysisComplete` with the backend response
7. Handles errors and resets file input

### Step 3: StatsDisplay Component (`StatsDisplay.tsx`)

**What it displays:**
- Word count, sentence count, paragraph count
- Character counts (with/without spaces)
- Average words per sentence
- Average characters per word

**Comparison Feature:**
- Receives `differences` object from backend
- Shows green `+X` indicators for increases
- Only shows positive differences (new content)

**UI Design:**
- Grid layout (responsive)
- Dark theme cards
- Hover effects for interactivity

### Step 4: ProgressBar Component (`ProgressBar.tsx`)

**Features:**
- Visual progress bar to 100,000 words
- Shows current word count on the bar
- Displays percentage complete
- Shows remaining words

**Calculation:**
```typescript
const percentage = Math.min((wordCount / TARGET_WORDS) * 100, 100);
```
- Caps at 100% if over target
- Smooth animations via CSS transitions

---

## Data Flow

```
User Selects PDF
    ↓
FileUpload Component
    ↓
Extract Text in Browser (pdfjs-dist)
    ↓
Analyze Writing Statistics (analyzeWriting.ts)
    ↓
POST /api/stats (Backend)
    ↓
Query PostgreSQL / In-Memory Store for Previous Upload
    ↓
Save Current Stats (Replaces Previous Upload)
    ↓
Calculate Differences
    ↓
Return JSON Response
    ↓
Update React State
    ↓
Render StatsDisplay + ProgressBar
```

---

## Styling Approach

### Dark Mode Theme

**Color Palette:**
- Background: `#0f0f23` (deep dark blue)
- Cards: `#1a1a2e` (slightly lighter)
- Borders: `#2a2a3e` (subtle borders)
- Accent: `#667eea` to `#764ba2` (purple gradient)
- Text: `#ffffff` (primary), `#a0a0b8` (secondary)

**Design Principles:**
- High contrast for readability
- Smooth transitions and hover effects
- Responsive grid layouts
- Modern gradient accents

---

## PostgreSQL Database Schema

**Table Name:** `writing_uploads`

**Table Structure:**
```sql
CREATE TABLE writing_uploads (
  id SERIAL PRIMARY KEY,
  word_count INTEGER NOT NULL,
  sentence_count INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  char_count_no_spaces INTEGER NOT NULL,
  paragraph_count INTEGER NOT NULL,
  avg_words_per_sentence NUMERIC(10, 2) NOT NULL,
  avg_chars_per_word NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- `id`: Auto-incrementing primary key (SERIAL)
- All statistics stored as appropriate data types
- `created_at`: Automatically set on insert
- **Single-row storage**: Each new upload replaces the previous one (DELETE + INSERT)
- Minimizes storage for cost-effective snapshot workflow

**Query Pattern:**
- Only one row exists at a time
- `saveUpload`: DELETE all rows, then INSERT the new one
- `getPreviousUpload`: SELECT the single row (for comparison with current upload)
- Perfect for cost optimization: snapshot → delete DB → pay only for snapshot storage

---

## Security Considerations

1. **Client-Side PDF Parsing**: PDF files never leave the user's browser; only lightweight numeric statistics (`1mb` JSON payload limit) are sent to the backend
2. **File Size & Type Validation**: Only PDFs up to 50MB are accepted in the UI
3. **Environment Variables & Secrets**: Sensitive database credentials live in `.env` or Kubernetes Secrets (`writing-analyzer-db`, not committed to git)
4. **CORS**: Configured to allow frontend requests
5. **Error Handling**: No sensitive info leaked in errors

---

## Deployment Considerations

### AWS EKS, Kubernetes + Nginx

**Infrastructure (`terraform/`):**
- Provisions `writing-analyzer-vpc` (`10.0.0.0/16`) and an Amazon EKS Auto Mode cluster (`general-purpose` node pool)

**Frontend (`k8s/frontend.yaml`, `frontend/Dockerfile`, `frontend/nginx.conf`):**
- Multi-stage Docker build (`npm run build` → `dist/`) served by `nginx:alpine`
- Exposed via an internet-facing AWS LoadBalancer `Service` on port 80
- Nginx proxies `/api/*` requests to `writing-analyzer-backend.writing-analyzer.svc.cluster.local:3001` using the EKS cluster DNS resolver (`172.20.0.10`)

**Backend (`k8s/backend.yaml`, `backend/Dockerfile`):**
- Runs in a separate pod (`ClusterIP` service on port 3001)
- Reads optional database credentials from the `writing-analyzer-db` Kubernetes Secret (if the secret is absent, runs in in-memory mode)

**Environment Variables (Optional for DB Persistence):**
- `DB_HOST` - RDS endpoint or localhost
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: `writing_analyzer`)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SSL` - `'true'` for RDS, `'false'` for local
- `PORT` - Backend server port (optional, defaults to 3001)

**RDS Snapshot Workflow (Cost-Optimized):**
1. Create an RDS PostgreSQL instance (or restore from snapshot) and apply `k8s/db-secret.yaml`
2. Application auto-creates table schema on startup
3. Use application - only the most recent upload is stored (replaced on each upload)
4. Take final snapshot when done
5. Delete the database instance - you only pay for snapshot storage
6. Next session: restore from snapshot into a new database to continue

---

## Future Enhancements

Potential improvements:
- Multiple document tracking (not just "latest")
- Historical charts/graphs
- Export statistics to CSV/JSON
- Support for other file types (DOCX, TXT)
- User authentication for multi-user support
- More detailed writing analysis (readability scores, etc.)

