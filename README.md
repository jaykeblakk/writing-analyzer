# Writing Analyzer

A modern React application that analyzes your writing from PDF documents, tracks your progress toward a 100,000-word goal, and compares your current writing with previous uploads.

## Features

- 📄 **PDF Upload & Analysis**: Upload PDF documents and get comprehensive writing statistics
- 📊 **Writing Statistics**: Word count, sentence count, paragraph count, character counts, and averages
- 📈 **Progress Tracking**: Visual progress bar showing your journey to 100,000 words
- 🔄 **Comparison Tracking**: See how much you've added since your last upload (shown in green)
- 🌙 **Dark Mode**: Beautiful dark theme designed for comfortable viewing
- ☁️ **AWS Integration**: Stores your writing stats in AWS RDS (PostgreSQL) for persistence

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Modern build tool for fast development
- **CSS3** - Custom dark theme styling

### Backend
- **Node.js** with Express
- **pdf-parse** - PDF text extraction
- **PostgreSQL** - RDS database for data persistence
- **Multer** - File upload handling

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

### Database Snapshots (RDS)

This application is designed to work with RDS database snapshots:

1. **Initial Setup**: Create an RDS PostgreSQL database via Terraform
2. **Restore from Snapshot**: Restore your database from a snapshot when starting a session
3. **Usage**: Upload and analyze your writing - all data is stored in the database
4. **Final Snapshot**: Before destroying the database, take a final snapshot
5. **Next Session**: Restore from the latest snapshot to continue where you left off

The application automatically creates the table schema on startup, so you only need to ensure the database exists and is accessible.

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
4. **Database Lookup**: Backend queries PostgreSQL for the most recent upload
5. **Comparison**: Calculates differences between current and previous stats
6. **Storage**: Saves current stats to PostgreSQL (adds new row, keeps history)
7. **Response**: Returns stats and differences to frontend
8. **Display**: Frontend displays stats with green indicators for increases, progress bar, and percentage

### Database Schema

The PostgreSQL table `writing_uploads` stores all uploads with the following structure:
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

**Note**: The application queries for the most recent upload (ORDER BY created_at DESC LIMIT 1) to compare with the current upload. All uploads are stored, maintaining a history of your writing progress.

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

## API Endpoints

### POST `/api/analyze`
Uploads and analyzes a PDF file.

**Request**: Multipart form data with `pdf` field

**Response**:
```json
{
  "success": true,
  "stats": {
    "wordCount": 40000,
    "sentenceCount": 2500,
    "charCount": 200000,
    "charCountNoSpaces": 180000,
    "paragraphCount": 500,
    "avgWordsPerSentence": 16.0,
    "avgCharsPerWord": 4.5
  },
  "differences": {
    "wordCount": 5000,
    "sentenceCount": 300,
    ...
  },
  "previousUpload": {
    "wordCount": 35000,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/api/health`
Health check endpoint.

## Customization

- **Target Word Count**: Change `TARGET_WORDS` in `ProgressBar.tsx` (currently 100,000)
- **File Size Limit**: Modify the `limits.fileSize` in `backend/server.js` (currently 50MB)
- **Color Scheme**: Adjust CSS variables in component CSS files

## License

ISC

