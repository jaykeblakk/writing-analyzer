# Writing Analyzer

A React application that analyzes writing from PDF documents, tracks progress toward a 100,000 word goal, and compares the writing of the current file from .

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- CSS3

### Backend
- Node.js with Express
- pdf-parse
- PostgreSQL
- Multer

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- AWS RDS PostgreSQL database (or local PostgreSQL for development)
- Database connection credentials

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=writing_analyzer
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_SSL=true
PORT=3001
```

**Note**: For local development, you can use:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writing_analyzer
DB_USER=postgres
DB_PASSWORD=your-local-password
DB_SSL=false
PORT=3001
```

4. The database table will be automatically created on first startup. Alternatively, you can manually run the schema:
```bash
psql -h your-host -U your-user -d your-database -f schema.sql
```

5. Start the backend server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory (optional, defaults to localhost):
```env
VITE_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment

### Kubernetes & Nginx

The application is designed to run in a Kubernetes container with nginx serving the frontend.

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Create Docker images** for both frontend and backend

3. **Configure nginx** to serve the frontend static files and proxy API requests to the backend

4. **Set environment variables** in your Kubernetes deployment for database credentials

### Database Snapshots (RDS) - Cost-Optimized Workflow

This application is designed for a minimal-cost RDS snapshot workflow:

1. **Initial Setup**: Create an RDS PostgreSQL database via Terraform
2. **Restore from Snapshot**: Restore your database from a snapshot when starting a session
3. **Usage**: Upload and analyze your writing - **only the most recent upload is stored** (each new upload replaces the previous one)
4. **Final Snapshot**: When done, take a snapshot of the database
5. **Delete Database**: Destroy the database instance - you only pay for the snapshot storage
6. **Next Session**: Restore from the snapshot into a new database to continue where you left off

By storing only one row and keeping just the snapshot between sessions, you minimize costs (no ongoing database instance charges).

## How It Works

### Step-by-Step Process

1. **File Upload**: User uploads a PDF file through the React frontend
2. **PDF Processing**: Backend receives the file, extracts text using `pdf-parse`
3. **Analysis**: The text is analyzed to calculate:
   - Word count
   - Sentence count
   - Paragraph count
   - Character counts (with and without spaces)
   - Average words per sentence
   - Average characters per word
4. **Database Lookup**: Backend queries PostgreSQL for the previous upload (if any)
5. **Comparison**: Calculates differences between current and previous stats
6. **Storage**: Saves current stats to PostgreSQL (replaces previous upload - only one row is ever kept)
7. **Response**: Returns stats and differences to frontend
8. **Display**: Frontend displays stats with green indicators for increases, progress bar, and percentage

### Database Schema

The PostgreSQL table `writing_uploads` stores **only the most recent upload** (single row, replaced on each upload) with the following structure:
- `id`: SERIAL (auto-incrementing primary key)
- `word_count`: INTEGER
- `sentence_count`: INTEGER
- `char_count`: INTEGER
- `char_count_no_spaces`: INTEGER
- `paragraph_count`: INTEGER
- `avg_words_per_sentence`: NUMERIC(10, 2)
- `avg_chars_per_word`: NUMERIC(10, 2)
- `created_at`: TIMESTAMP (auto-set on insert)
- `updated_at`: TIMESTAMP (auto-set on insert)

**Note**: Each new upload replaces the previous one. Only one row exists at a time, minimizing storage for the snapshot workflow.

## Project Structure

```
writing-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx      # PDF upload component
│   │   │   ├── StatsDisplay.tsx    # Statistics display with comparisons
│   │   │   └── ProgressBar.tsx     # 100k word progress bar
│   │   ├── App.tsx                 # Main application component
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global dark theme styles
│   ├── index.html
│   └── package.json
├── backend/
│   ├── server.js                   # Express API server
│   ├── database.js                 # PostgreSQL connection and queries
│   ├── schema.sql                  # Database schema (optional manual setup)
│   ├── package.json
│   └── .env                        # Environment variables (not in git)
└── README.md
```

