-- PostgreSQL schema for Writing Analyzer
-- This file can be used to manually create the table if needed
-- The application will auto-create it on startup via database.js
--
-- Storage model: Only the most recent upload is kept. Each new upload replaces the previous one.
-- This minimizes storage costs when using the snapshot workflow (snapshot → delete DB → pay only for snapshot).

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

COMMENT ON TABLE writing_uploads IS 'Stores only the most recent writing analysis (single row, replaced on each upload)';



