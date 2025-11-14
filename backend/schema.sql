-- PostgreSQL schema for Writing Analyzer
-- This file can be used to manually create the table if needed
-- The application will auto-create it on startup via database.js

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
);

-- Index for faster queries on most recent upload
CREATE INDEX IF NOT EXISTS idx_writing_uploads_created_at ON writing_uploads(created_at DESC);

-- Optional: Add a comment to the table
COMMENT ON TABLE writing_uploads IS 'Stores writing analysis statistics from PDF uploads';

