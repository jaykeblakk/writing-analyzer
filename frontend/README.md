# Writing Analyzer Frontend

React application for uploading and analyzing documents.

## Setup

```bash
cd frontend
npm install
cp env.example .env
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:5173`

Make sure the backend is running on `http://localhost:3001`

## Build for Production

```bash
npm run build
```

Output will be in the `dist` folder, ready for deployment to S3/CloudFront.

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:3001)

## Features

- Upload .txt, .pdf, and .docx files
- View comprehensive writing statistics
- Compare with previous uploads (green/red delta indicators)
- Track progress to 100,000 words
- Dark mode interface

