import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getPreviousUpload, saveUpload } from './database.js';
// Use legacy build for Node.js environments
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * Analyzes text and returns writing statistics
 */
function analyzeWriting(text) {
  // Remove extra whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Word count (split by spaces)
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Sentence count (split by sentence-ending punctuation)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Character count (including spaces)
  const charCount = text.length;
  
  // Character count (excluding spaces)
  const charCountNoSpaces = text.replace(/\s/g, '').length;
  
  // Paragraph count - improved detection
  // First, try splitting by double newlines
  let paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // If that doesn't work well, try detecting paragraphs by:
  // 1. Sentence endings followed by significant spacing
  // 2. Or by looking for patterns that suggest paragraph breaks
  if (paragraphs.length <= 1 && text.length > 100) {
    // Try a different approach: look for sentence endings followed by capital letters
    // This often indicates a new paragraph
    const sentenceEndPattern = /[.!?]\s+(?=[A-Z][a-z])/g;
    const potentialBreaks = text.match(sentenceEndPattern);
    
    // Also check for single newlines that might indicate paragraphs
    const singleNewlineBreaks = text.split(/\n+/).filter(p => p.trim().length > 20);
    
    // Use the method that gives us more reasonable results
    if (singleNewlineBreaks.length > paragraphs.length && singleNewlineBreaks.length < wordCount / 50) {
      paragraphs = singleNewlineBreaks;
    } else if (potentialBreaks && potentialBreaks.length > 0) {
      // Estimate paragraphs based on sentence patterns
      paragraphs = text.split(sentenceEndPattern).filter(p => p.trim().length > 20);
    }
  }
  
  const paragraphCount = Math.max(paragraphs.length, 1);
  
  // Average words per sentence
  const avgWordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(2) : 0;
  
  // Average characters per word
  const avgCharsPerWord = wordCount > 0 ? (charCountNoSpaces / wordCount).toFixed(2) : 0;
  
  return {
    wordCount,
    sentenceCount,
    charCount,
    charCountNoSpaces,
    paragraphCount,
    avgWordsPerSentence: parseFloat(avgWordsPerSentence),
    avgCharsPerWord: parseFloat(avgCharsPerWord),
  };
}


/**
 * POST /api/analyze - Upload and analyze PDF
 */
app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse PDF using pdfjs-dist
    const pdfBuffer = fs.readFileSync(req.file.path);
    
    // Convert Buffer to Uint8Array (required by pdfjs-dist)
    const uint8Array = new Uint8Array(pdfBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;
    
    // Extract text from all pages, preserving structure better
    let text = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Build text while preserving potential paragraph breaks
      let pageText = '';
      let lastY = null;
      
      for (const item of textContent.items) {
        // Check if there's a significant vertical gap (potential paragraph break)
        if (lastY !== null && item.transform && item.transform[5]) {
          const yGap = Math.abs(lastY - item.transform[5]);
          // If there's a large vertical gap (more than 1.5x typical line height), add newline
          if (yGap > 15) {
            pageText += '\n\n';
          } else if (yGap > 5) {
            pageText += '\n';
          } else {
            pageText += ' ';
          }
        }
        
        pageText += item.str;
        if (item.transform && item.transform[5]) {
          lastY = item.transform[5];
        }
      }
      
      text += pageText + '\n\n';
    }

    // Analyze the writing
    const stats = analyzeWriting(text);

    // Get previous upload for comparison
    const previousUpload = await getPreviousUpload();

    // Save current upload
    const result = await saveUpload(stats);
    const timestamp = result.timestamp;

    // Calculate differences if previous upload exists
    let differences = null;
    if (previousUpload) {
      differences = {
        wordCount: stats.wordCount - previousUpload.wordCount,
        sentenceCount: stats.sentenceCount - previousUpload.sentenceCount,
        charCount: stats.charCount - previousUpload.charCount,
        charCountNoSpaces: stats.charCountNoSpaces - previousUpload.charCountNoSpaces,
        paragraphCount: stats.paragraphCount - previousUpload.paragraphCount,
      };
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return results
    res.json({
      success: true,
      stats,
      differences,
      previousUpload: previousUpload ? {
        wordCount: previousUpload.wordCount,
        timestamp: previousUpload.timestamp,
      } : null,
    });
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze PDF', 
      message: error.message 
    });
  }
});

/**
 * GET /api/health - Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Database connection established');
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

