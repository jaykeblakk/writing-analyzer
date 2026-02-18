import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getPreviousUpload, saveUpload } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/**
 * POST /api/stats - Receive stats from frontend (PDF parsed in browser), save and return comparison
 */
app.post('/api/stats', async (req, res) => {
  try {
    const { stats } = req.body;
    if (!stats) {
      return res.status(400).json({ error: 'No stats provided' });
    }

    const previousUpload = await getPreviousUpload();
    const result = await saveUpload(stats);
    const timestamp = result.timestamp;

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

    res.json({
      success: true,
      stats,
      differences,
      previousUpload: previousUpload
        ? {
            wordCount: previousUpload.wordCount,
            timestamp: previousUpload.timestamp,
          }
        : null,
    });
  } catch (error) {
    console.error('Error saving stats:', error);
    res.status(500).json({
      error: 'Failed to save stats',
      message: error.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
