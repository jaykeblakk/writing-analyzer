# Writing Analyzer

Full-stack application for analyzing writing documents with progress tracking.

## Project Structure

```
writing-analyzer/
├── frontend/          # React application
│   ├── src/
│   └── ...
└── backend/           # Node.js API server
    ├── services/
    └── ...
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

API runs on `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- Upload .txt, .pdf, and .docx files
- Comprehensive writing statistics
- Compare with previous uploads
- Progress tracking to 100,000 words
- Dark mode interface

## Deployment

Ready for AWS deployment:
- Frontend: S3 + CloudFront
- Backend: EC2, ECS, or Lambda
- Database: RDS PostgreSQL

See individual README files in `frontend/` and `backend/` for details.
