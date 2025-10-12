# Development Startup Guide

## First Time Setup

### Backend
```bash
cd backend
npm install
copy env.example .env
```

### Frontend
```bash
cd frontend
npm install
copy env.example .env
```

## Running the Application

You need to run both servers simultaneously.

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

## Quick Test

1. Backend health check: http://localhost:3001/health
2. Frontend: http://localhost:5173
3. Upload a test document to see it all working!

