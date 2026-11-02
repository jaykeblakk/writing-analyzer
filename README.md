# Writing Analyzer

A React application that analyzes writing from PDF documents, tracks progress toward a 100,000 word goal, and compares the writing statistics of the current file against the previous upload.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite
- `pdfjs-dist` (client-side PDF text extraction)
- CSS3

### Backend
- Node.js with Express 5
- PostgreSQL (`pg`) with automatic in-memory fallback

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Optional: AWS RDS PostgreSQL database (or local PostgreSQL for development). If no database is configured, the backend automatically uses in-memory storage.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file in the `backend` directory for PostgreSQL persistence:
```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=writing_analyzer
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_SSL=true
PORT=3001
```

**Note**: For local PostgreSQL development, you can use:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writing_analyzer
DB_USER=postgres
DB_PASSWORD=your-local-password
DB_SSL=false
PORT=3001
```
If `DB_HOST`, `DB_USER`, and `DB_PASSWORD` are omitted, the server runs in in-memory mode.

4. When PostgreSQL is configured, the database table is automatically created on first startup. Alternatively, you can manually run the schema:
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

3. Create a `.env` file in the `frontend` directory (optional, defaults to current origin / `http://localhost:3001` in local dev):
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

### AWS EKS, Kubernetes & Nginx

The infrastructure and deployment manifests are included in `terraform/` and `k8s/` (see [DEPLOY.md](./DEPLOY.md) for step-by-step instructions):

- **Terraform (`terraform/`)**: Provisions the VPC (`writing-analyzer-vpc`) and an Amazon EKS cluster (EKS Auto Mode).
- **Docker (`frontend/Dockerfile`, `backend/Dockerfile`)**: Builds the frontend static bundle served by Nginx and the Node.js Express API image.
- **Kubernetes (`k8s/`)**: Deploys the frontend (`LoadBalancer` service) and backend (`ClusterIP` service) in the `writing-analyzer` namespace, with Nginx proxying `/api/*` requests to the backend service.

### Database Snapshots (RDS) - Cost-Optimized Workflow

This application supports a minimal-cost RDS snapshot workflow (or can run without RDS using in-memory storage):

1. **Initial Setup**: Create an RDS PostgreSQL database (or restore from snapshot) and apply `k8s/db-secret.yaml`
2. **Restore from Snapshot**: Restore your database from a snapshot when starting a session
3. **Usage**: Upload and analyze your writing - **only the most recent upload is stored** (each new upload replaces the previous one)
4. **Final Snapshot**: When done, take a snapshot of the database
5. **Delete Database**: Destroy the database instance - you only pay for the snapshot storage
6. **Next Session**: Restore from the snapshot into a new database to continue where you left off

By storing only one row and keeping just the snapshot between sessions, you minimize costs (no ongoing database instance charges).

## How It Works

### Step-by-Step Process

1. **File Upload**: User selects a PDF file through the React frontend (`FileUpload.tsx`)
2. **Browser PDF Processing**: The frontend extracts text directly in the browser using `pdfjs-dist`
3. **Client-Side Analysis**: The extracted text is analyzed in the browser (`analyzeWriting.ts`) to calculate:
   - Word count
   - Sentence count
   - Paragraph count
   - Character counts (with and without spaces)
   - Average words per sentence
   - Average characters per word
4. **API Request**: Frontend sends the computed `stats` JSON to `POST /api/stats`
5. **Database Lookup**: Backend queries PostgreSQL (or in-memory store) for the previous upload (if any)
6. **Storage & Comparison**: Backend saves the current stats (replacing the previous upload so only one row is kept) and calculates differences between current and previous stats
7. **Response**: Returns `stats`, `differences`, and `previousUpload` metadata to the frontend
8. **Display**: Frontend displays stats with green `+X` indicators for increases, a 100k-word progress bar, and completion percentage

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
│   │   │   ├── FileUpload.tsx      # Browser PDF parsing & upload component
│   │   │   ├── StatsDisplay.tsx    # Statistics display with comparisons
│   │   │   └── ProgressBar.tsx     # 100k word progress bar
│   │   ├── utils/
│   │   │   └── analyzeWriting.ts   # Text analysis calculations
│   │   ├── App.tsx                 # Main application component
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global dark theme styles
│   ├── Dockerfile
│   ├── nginx.conf                  # Nginx static server + /api/ reverse proxy
│   ├── index.html
│   └── package.json
├── backend/
│   ├── server.js                   # Express API server (/api/stats, /api/health)
│   ├── database.js                 # PostgreSQL connection & in-memory fallback
│   ├── schema.sql                  # Database schema (optional manual setup)
│   ├── Dockerfile
│   └── package.json
├── k8s/                            # Kubernetes manifests (Namespace, Deployments, Services, NodePool)
├── terraform/                      # Terraform configs for AWS VPC & EKS Auto Mode cluster
├── DEPLOY.md                       # EKS deployment guide
├── ARCHITECTURE.md                 # Architecture & code walkthrough
└── README.md
```

