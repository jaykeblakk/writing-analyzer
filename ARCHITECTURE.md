# Architecture & Code Walkthrough

This document explains the application architecture and walks through the code step by step.

## Overview

The Writing Analyzer is a full-stack application with:
- **Frontend**: React + TypeScript + Vite (modern, fast build tool)
- **Backend**: Node.js + Express (RESTful API)
- **Database**: AWS RDS PostgreSQL (relational database with snapshot support)
- **File Processing**: PDF text extraction and analysis

---

## Backend Architecture (`backend/server.js`)

### Step 1: Server Setup and Configuration

```javascript
import express from 'express';
import cors from 'cors';
import multer from 'multer';
// ... other imports
```

**What this does:**
- Uses ES6 modules (modern JavaScript)
- `express`: Web server framework
- `cors`: Allows frontend to make requests (Cross-Origin Resource Sharing)
- `multer`: Handles file uploads
- `pdf-parse`: Extracts text from PDF files
- `pg`: PostgreSQL client library for database operations

### Step 2: PostgreSQL Database Configuration (`backend/database.js`)

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
```

**What this does:**
- Creates a PostgreSQL connection pool for efficient database connections
- Uses environment variables for database credentials
- Supports SSL connections for RDS (required for AWS)
- Connection pooling allows multiple concurrent requests

### Step 3: File Upload Configuration

```javascript
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
```

**What this does:**
- Configures multer to save uploaded files to `uploads/` directory
- Sets a 50MB file size limit for security
- Files are temporarily stored, then deleted after processing

### Step 4: Writing Analysis Function

```javascript
function analyzeWriting(text) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  // ... more analysis
}
```

**What this does:**
- Cleans the text (removes extra whitespace)
- Splits text into words, sentences, paragraphs
- Calculates statistics:
  - Word count: Number of words
  - Sentence count: Split by `.`, `!`, `?`
  - Paragraph count: Split by double newlines
  - Averages: Words per sentence, characters per word

### Step 5: Database Functions (`backend/database.js`)

**`initializeDatabase()`:**
- Creates the `writing_uploads` table if it doesn't exist
- Creates an index on `created_at` for faster queries
- Called automatically on server startup

**`getPreviousUpload()`:**
- Queries PostgreSQL for the stored upload (only one row exists)
- Returns the previous upload's statistics for comparison
- Returns `null` if no previous upload exists

**`saveUpload()`:**
- Deletes any existing row, then inserts the new statistics
- Only the most recent upload is kept (replaces on each upload)
- Minimizes storage for cost-effective snapshot workflow
- Returns the created timestamp

### Step 6: API Endpoint - `/api/analyze`

**Flow:**
1. Receives uploaded PDF file via `multer`
2. Reads PDF file from disk
3. Extracts text using `pdf-parse`
4. Analyzes text with `analyzeWriting()`
5. Fetches previous upload from PostgreSQL (single row, if any)
6. Calculates differences (current - previous)
7. Saves current upload to PostgreSQL (replaces previous - only one row kept)
8. Deletes temporary file
9. Returns JSON response with stats and differences

**Error Handling:**
- Validates file exists
- Handles PDF parsing errors
- Handles database errors gracefully
- Always cleans up temporary files

---

## Frontend Architecture

### Component Structure

```
App.tsx (Main Container)
├── FileUpload.tsx (Handles PDF upload)
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

### Step 2: FileUpload Component (`FileUpload.tsx`)

**Key Features:**
- Hidden file input (styled upload area)
- Click or drag-and-drop support
- File validation (PDF only, size limit)
- Uploads to backend API

**Process:**
1. User selects/clicks upload area
2. Validates file type and size
3. Creates `FormData` with file
4. Sends POST request to `/api/analyze`
5. Shows loading state
6. Calls `onAnalysisComplete` with results
7. Handles errors gracefully

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
User Uploads PDF
    ↓
FileUpload Component
    ↓
POST /api/analyze (Backend)
    ↓
Extract Text from PDF
    ↓
Analyze Writing Statistics
    ↓
Query PostgreSQL for Previous Upload
    ↓
Calculate Differences
    ↓
Save to PostgreSQL
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

1. **File Size Limits**: 50MB max to prevent DoS
2. **File Type Validation**: Only PDFs accepted
3. **Temporary Files**: Always deleted after processing
4. **Environment Variables**: Sensitive data in `.env` (not in git)
5. **CORS**: Configured to allow frontend requests
6. **Error Handling**: No sensitive info leaked in errors

---

## Deployment Considerations

### Kubernetes + Nginx

**Frontend:**
- Build with `npm run build` → creates `dist/` folder
- Serve static files via nginx
- Configure nginx to proxy `/api/*` to backend

**Backend:**
- Run in separate container/pod
- Expose port 3001
- Set environment variables via Kubernetes secrets

**Environment Variables Needed:**
- `DB_HOST` - RDS endpoint or localhost
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SSL` - 'true' for RDS, 'false' for local
- `PORT` - Backend server port (optional, defaults to 3001)

**RDS Snapshot Workflow (Cost-Optimized):**
1. Create RDS PostgreSQL instance via Terraform
2. Restore from snapshot (if exists) when starting session
3. Application auto-creates table schema on startup
4. Use application - only the most recent upload is stored (replaced on each upload)
5. Take final snapshot when done
6. Delete the database instance - you only pay for snapshot storage
7. Next session: restore from snapshot into a new database to continue

---

## Future Enhancements

Potential improvements:
- Multiple document tracking (not just "latest")
- Historical charts/graphs
- Export statistics to CSV/JSON
- Support for other file types (DOCX, TXT)
- User authentication for multi-user support
- More detailed writing analysis (readability scores, etc.)

