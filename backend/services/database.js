import pg from 'pg'
const { Pool } = pg

// For local development, we'll use an in-memory store
// In AWS, this will be replaced with actual PostgreSQL connection
let localStore = {}

// Check if we're using a real database or local storage
const useDatabase = process.env.DATABASE_URL ? true : false

let pool
if (useDatabase) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
}

// Initialize database table (call this on startup)
export async function initializeDatabase() {
  if (!useDatabase) {
    console.log('📝 Using local in-memory storage (no database configured)')
    return
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_analyses (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        word_count INTEGER,
        character_count INTEGER,
        character_count_no_spaces INTEGER,
        sentence_count INTEGER,
        paragraph_count INTEGER,
        unique_words INTEGER,
        average_word_length DECIMAL(5,2),
        average_words_per_sentence DECIMAL(5,2),
        average_sentence_length DECIMAL(5,2),
        flesch_score DECIMAL(5,2),
        common_word_percentage DECIMAL(5,2),
        reading_time INTEGER,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create index on file_name for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_file_name ON document_analyses(file_name)
    `)
    
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}

// Save analysis to database
export async function saveAnalysis(fileName, analysis) {
  if (!useDatabase) {
    // Local storage fallback
    localStore[fileName] = {
      ...analysis,
      savedAt: new Date().toISOString()
    }
    console.log(`💾 Saved analysis for ${fileName} to local storage`)
    return
  }
  
  try {
    const query = `
      INSERT INTO document_analyses (
        file_name, word_count, character_count, character_count_no_spaces,
        sentence_count, paragraph_count, unique_words, average_word_length,
        average_words_per_sentence, average_sentence_length, flesch_score,
        common_word_percentage, reading_time, analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `
    
    const values = [
      fileName,
      analysis.wordCount,
      analysis.characterCount,
      analysis.characterCountNoSpaces,
      analysis.sentenceCount,
      analysis.paragraphCount,
      analysis.uniqueWords,
      analysis.averageWordLength,
      analysis.averageWordsPerSentence,
      analysis.averageSentenceLength,
      analysis.fleschScore,
      analysis.commonWordPercentage,
      analysis.readingTime,
      analysis.analyzedAt
    ]
    
    const result = await pool.query(query, values)
    console.log(`💾 Saved analysis for ${fileName} to database (ID: ${result.rows[0].id})`)
    return result.rows[0]
  } catch (error) {
    console.error('Error saving analysis:', error)
    throw error
  }
}

// Get previous analysis for a file
export async function getPreviousAnalysis(fileName) {
  if (!useDatabase) {
    // Local storage fallback
    return localStore[fileName] || null
  }
  
  try {
    const query = `
      SELECT * FROM document_analyses
      WHERE file_name = $1
      ORDER BY analyzed_at DESC
      LIMIT 1
      OFFSET 1
    `
    
    const result = await pool.query(query, [fileName])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      wordCount: row.word_count,
      characterCount: row.character_count,
      characterCountNoSpaces: row.character_count_no_spaces,
      sentenceCount: row.sentence_count,
      paragraphCount: row.paragraph_count,
      uniqueWords: row.unique_words,
      averageWordLength: parseFloat(row.average_word_length),
      averageWordsPerSentence: parseFloat(row.average_words_per_sentence),
      averageSentenceLength: parseFloat(row.average_sentence_length),
      fleschScore: parseFloat(row.flesch_score),
      commonWordPercentage: parseFloat(row.common_word_percentage),
      readingTime: row.reading_time,
      analyzedAt: row.analyzed_at
    }
  } catch (error) {
    console.error('Error getting previous analysis:', error)
    throw error
  }
}

// Get all analyses for a file (history)
export async function getAnalysisHistory(fileName, limit = 10) {
  if (!useDatabase) {
    const analysis = localStore[fileName]
    return analysis ? [analysis] : []
  }
  
  try {
    const query = `
      SELECT * FROM document_analyses
      WHERE file_name = $1
      ORDER BY analyzed_at DESC
      LIMIT $2
    `
    
    const result = await pool.query(query, [fileName, limit])
    return result.rows
  } catch (error) {
    console.error('Error getting analysis history:', error)
    throw error
  }
}

// Initialize on module load
initializeDatabase().catch(console.error)

