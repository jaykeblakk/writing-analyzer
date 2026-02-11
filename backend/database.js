// Database layer - supports PostgreSQL (RDS) or in-memory storage when DB not configured
import pg from 'pg';

const { Pool } = pg;

let pool = null;
let useMemoryStorage = true;

/**
 * Initialize database - connects to PostgreSQL if configured, otherwise uses in-memory storage
 */
export async function initializeDatabase() {
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    useMemoryStorage = false;
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'writing_analyzer',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS writing_uploads (
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
      )
    `);
    console.log('Database connection established (PostgreSQL)');
  } else {
    useMemoryStorage = true;
    console.log('Using in-memory storage (no database configured - set DB_HOST, DB_USER, DB_PASSWORD)');
  }
  return Promise.resolve();
}

// In-memory storage for when PostgreSQL is not configured
let latestUpload = null;

/**
 * Retrieves the most recent upload (only one is ever stored)
 */
export async function getPreviousUpload() {
  if (useMemoryStorage) {
    if (latestUpload) {
      return {
        wordCount: latestUpload.wordCount,
        sentenceCount: latestUpload.sentenceCount,
        charCount: latestUpload.charCount,
        charCountNoSpaces: latestUpload.charCountNoSpaces,
        paragraphCount: latestUpload.paragraphCount,
        avgWordsPerSentence: latestUpload.avgWordsPerSentence,
        avgCharsPerWord: latestUpload.avgCharsPerWord,
        timestamp: latestUpload.timestamp,
      };
    }
    return null;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM writing_uploads ORDER BY created_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      wordCount: row.word_count,
      sentenceCount: row.sentence_count,
      charCount: row.char_count,
      charCountNoSpaces: row.char_count_no_spaces,
      paragraphCount: row.paragraph_count,
      avgWordsPerSentence: parseFloat(row.avg_words_per_sentence),
      avgCharsPerWord: parseFloat(row.avg_chars_per_word),
      timestamp: row.created_at ? new Date(row.created_at).toISOString() : null,
    };
  } catch (error) {
    console.error('Error fetching previous upload:', error);
    return null;
  }
}

/**
 * Saves the current upload, replacing any previous upload (only the most recent is kept)
 */
export async function saveUpload(stats) {
  const timestamp = new Date().toISOString();

  if (useMemoryStorage) {
    latestUpload = {
      wordCount: stats.wordCount,
      sentenceCount: stats.sentenceCount,
      charCount: stats.charCount,
      charCountNoSpaces: stats.charCountNoSpaces,
      paragraphCount: stats.paragraphCount,
      avgWordsPerSentence: stats.avgWordsPerSentence,
      avgCharsPerWord: stats.avgCharsPerWord,
      timestamp,
    };
    return { timestamp };
  }

  try {
    await pool.query('DELETE FROM writing_uploads');
    await pool.query(
      `INSERT INTO writing_uploads (
        word_count, sentence_count, char_count, char_count_no_spaces,
        paragraph_count, avg_words_per_sentence, avg_chars_per_word
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        stats.wordCount,
        stats.sentenceCount,
        stats.charCount,
        stats.charCountNoSpaces,
        stats.paragraphCount,
        stats.avgWordsPerSentence,
        stats.avgCharsPerWord,
      ]
    );
    return { timestamp };
  } catch (error) {
    console.error('Error saving upload:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  return Promise.resolve();
}
