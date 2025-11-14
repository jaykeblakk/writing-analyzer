// In-memory storage for testing (no database required)
// This will be replaced with PostgreSQL/RDS later

// Simple in-memory cache to store the latest upload
let latestUpload = null;

/**
 * Initialize database - for now, just uses in-memory storage
 */
export async function initializeDatabase() {
  console.log('Using in-memory storage (no database connection required)');
  // No-op for in-memory storage
  return Promise.resolve();
}

/**
 * Retrieves the most recent upload from cache
 */
export async function getPreviousUpload() {
  try {
    // Return the cached upload if it exists
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
  } catch (error) {
    console.error('Error fetching previous upload:', error);
    return null;
  }
}

/**
 * Saves the current upload to cache
 */
export async function saveUpload(stats) {
  try {
    const timestamp = new Date().toISOString();
    
    // Store in memory
    latestUpload = {
      wordCount: stats.wordCount,
      sentenceCount: stats.sentenceCount,
      charCount: stats.charCount,
      charCountNoSpaces: stats.charCountNoSpaces,
      paragraphCount: stats.paragraphCount,
      avgWordsPerSentence: stats.avgWordsPerSentence,
      avgCharsPerWord: stats.avgCharsPerWord,
      timestamp: timestamp,
    };
    
    return { timestamp };
  } catch (error) {
    console.error('Error saving upload:', error);
    throw error;
  }
}

/**
 * Close database connection - no-op for in-memory storage
 */
export async function closeDatabase() {
  // No-op for in-memory storage
  return Promise.resolve();
}
