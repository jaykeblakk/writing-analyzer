import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [previousAnalysis, setPreviousAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Function to handle file upload and send to backend
  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')
    setAnalysis(null)
    setPreviousAnalysis(null)
    setLoading(true)

    try {
      // Create FormData to send file
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Send to backend API
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to analyze document')
      }

      const data = await response.json()
      
      setAnalysis(data.analysis)
      setPreviousAnalysis(data.previousAnalysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Function to calculate delta from previous analysis
  const calculateDelta = (current, previous, key) => {
    if (!previous || previous[key] === undefined) return null
    return current - previous[key]
  }

  // Function to reset the application
  const resetApp = () => {
    setFile(null)
    setAnalysis(null)
    setPreviousAnalysis(null)
    setError('')
    setLoading(false)
    // Reset file input
    const fileInput = document.getElementById('fileInput')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Writing Analyzer</h1>
        <p>Upload a document to analyze your writing statistics</p>
      </header>

      <main className="app-main">
        {!analysis ? (
          <div className="upload-section">
            <div className="upload-area">
              <input
                id="fileInput"
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="file-input"
              />
              <label htmlFor="fileInput" className="file-label">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Click to upload file for analysis</strong>
                </div>
                <div className="upload-subtext">
                  Supports .txt, .pdf, and .docx files
                </div>
              </label>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyzing your document please wait...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <p>❌ {error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2>📊 Writing Analysis Results</h2>
              <button onClick={resetApp} className="reset-button">
                Upload Another Document
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-number">{analysis.wordCount.toLocaleString()}</div>
                {calculateDelta(analysis.wordCount, previousAnalysis, 'wordCount') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.wordCount, previousAnalysis, 'wordCount') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.wordCount, previousAnalysis, 'wordCount') >= 0 ? '+' : ''}{calculateDelta(analysis.wordCount, previousAnalysis, 'wordCount').toLocaleString()}
                  </div>
                )}
                <div className="stat-label">Total Words</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.characterCount.toLocaleString()}</div>
                {calculateDelta(analysis.characterCount, previousAnalysis, 'characterCount') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.characterCount, previousAnalysis, 'characterCount') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.characterCount, previousAnalysis, 'characterCount') >= 0 ? '+' : ''}{calculateDelta(analysis.characterCount, previousAnalysis, 'characterCount').toLocaleString()}
                  </div>
                )}
                <div className="stat-label">Characters</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.characterCountNoSpaces.toLocaleString()}</div>
                {calculateDelta(analysis.characterCountNoSpaces, previousAnalysis, 'characterCountNoSpaces') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.characterCountNoSpaces, previousAnalysis, 'characterCountNoSpaces') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.characterCountNoSpaces, previousAnalysis, 'characterCountNoSpaces') >= 0 ? '+' : ''}{calculateDelta(analysis.characterCountNoSpaces, previousAnalysis, 'characterCountNoSpaces').toLocaleString()}
                  </div>
                )}
                <div className="stat-label">Characters (no spaces)</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.sentenceCount}</div>
                {calculateDelta(analysis.sentenceCount, previousAnalysis, 'sentenceCount') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.sentenceCount, previousAnalysis, 'sentenceCount') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.sentenceCount, previousAnalysis, 'sentenceCount') >= 0 ? '+' : ''}{calculateDelta(analysis.sentenceCount, previousAnalysis, 'sentenceCount')}
                  </div>
                )}
                <div className="stat-label">Sentences</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.paragraphCount}</div>
                {calculateDelta(analysis.paragraphCount, previousAnalysis, 'paragraphCount') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.paragraphCount, previousAnalysis, 'paragraphCount') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.paragraphCount, previousAnalysis, 'paragraphCount') >= 0 ? '+' : ''}{calculateDelta(analysis.paragraphCount, previousAnalysis, 'paragraphCount')}
                  </div>
                )}
                <div className="stat-label">Paragraphs</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.uniqueWords.toLocaleString()}</div>
                {calculateDelta(analysis.uniqueWords, previousAnalysis, 'uniqueWords') !== null && (
                  <div className={`stat-delta ${calculateDelta(analysis.uniqueWords, previousAnalysis, 'uniqueWords') >= 0 ? 'positive' : 'negative'}`}>
                    {calculateDelta(analysis.uniqueWords, previousAnalysis, 'uniqueWords') >= 0 ? '+' : ''}{calculateDelta(analysis.uniqueWords, previousAnalysis, 'uniqueWords').toLocaleString()}
                  </div>
                )}
                <div className="stat-label">Unique Words</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.averageWordLength}</div>
                <div className="stat-label">Avg Word Length</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.averageWordsPerSentence}</div>
                <div className="stat-label">Words per Sentence</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.averageSentenceLength}</div>
                <div className="stat-label">Avg Sentence Length</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.fleschScore}</div>
                <div className="stat-label">Flesch Reading Score</div>
                <div className="stat-description">
                  {analysis.fleschScore >= 90 ? 'Very Easy' :
                   analysis.fleschScore >= 80 ? 'Easy' :
                   analysis.fleschScore >= 70 ? 'Fairly Easy' :
                   analysis.fleschScore >= 60 ? 'Standard' :
                   analysis.fleschScore >= 50 ? 'Fairly Difficult' :
                   analysis.fleschScore >= 30 ? 'Difficult' : 'Very Difficult'}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.commonWordPercentage}%</div>
                <div className="stat-label">Common Words</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{analysis.readingTime} min</div>
                <div className="stat-label">Est. Reading Time</div>
              </div>
            </div>

            <div className="progress-section">
              <h3>🎯 Progress to 100,000 Words</h3>
              <div className="progress-stats">
                <span className="progress-current">{analysis.wordCount.toLocaleString()} words</span>
                <span className="progress-target">100,000 words</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min((analysis.wordCount / 100000) * 100, 100)}%` }}
                >
                  <span className="progress-percentage">
                    {Math.round((analysis.wordCount / 100000) * 100)}%
                  </span>
                </div>
              </div>
              <div className="progress-remaining">
                {analysis.wordCount >= 100000 ? (
                  <span className="progress-complete">🎉 Goal achieved! You've written {(analysis.wordCount - 100000).toLocaleString()} words beyond your target!</span>
                ) : (
                  <span>{(100000 - analysis.wordCount).toLocaleString()} words remaining</span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React • Upload your documents to get started</p>
      </footer>
    </div>
  )
}

export default App
