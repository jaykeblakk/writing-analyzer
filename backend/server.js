import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import { analyzeDocument } from './services/analyzer.js'
import { saveAnalysis, getPreviousAnalysis } from './services/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Writing Analyzer API is running' })
})

// Upload and analyze document
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { originalname, mimetype, buffer } = req.file
    
    // Analyze the document
    const analysis = await analyzeDocument(buffer, mimetype, originalname)
    
    // Get previous analysis for this file
    const previousAnalysis = await getPreviousAnalysis(originalname)
    
    // Save current analysis to database
    await saveAnalysis(originalname, analysis)
    
    res.json({
      success: true,
      analysis,
      previousAnalysis
    })
  } catch (error) {
    console.error('Error analyzing document:', error)
    res.status(500).json({ 
      error: 'Failed to analyze document', 
      message: error.message 
    })
  }
})

// Get analysis history for a specific file
app.get('/api/history/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const analysis = await getPreviousAnalysis(filename)
    
    if (!analysis) {
      return res.status(404).json({ error: 'No history found for this file' })
    }
    
    res.json({ success: true, analysis })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ 
      error: 'Failed to fetch history', 
      message: error.message 
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Writing Analyzer API running on http://localhost:${PORT}`)
})

