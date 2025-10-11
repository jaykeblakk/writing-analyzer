import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [previousAnalysis, setPreviousAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Function to handle file upload
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setAnalysis(null)
      extractText(selectedFile)
    }
  }

  // Function to extract text from different file types
  const extractText = async (file) => {
    setLoading(true)
    setError('')
    
    try {
      const fileType = file.type
      let extractedText = ''

      if (fileType === 'text/plain') {
        // Handle text files
        extractedText = await file.text()
      } else if (fileType === 'application/pdf') {
        // Handle PDF files (browser-compatible)
        const arrayBuffer = await file.arrayBuffer()
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
        
        // Configure the worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.mjs',
          import.meta.url
        ).href
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          text += pageText + '\n'
        }
        
        extractedText = text
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle Word documents (.docx)
        const arrayBuffer = await file.arrayBuffer()
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      } else {
        throw new Error('Unsupported file type. Please upload a .txt, .pdf, or .docx file.')
      }

      setText(extractedText)
      analyzeText(extractedText, file.name)
    } catch (err) {
      setError(err.message)
      setText('')
    } finally {
      setLoading(false)
    }
  }

  // Function to load previous analysis from localStorage
  const loadPreviousAnalysis = (fileName) => {
    try {
      const stored = localStorage.getItem(`writing-analyzer-${fileName}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Error loading previous analysis:', err)
    }
    return null
  }

  // Function to save analysis to localStorage
  const saveAnalysis = (fileName, analysisData) => {
    try {
      const dataToSave = {
        ...analysisData,
        timestamp: new Date().toISOString(),
        fileName: fileName
      }
      localStorage.setItem(`writing-analyzer-${fileName}`, JSON.stringify(dataToSave))
    } catch (err) {
      console.error('Error saving analysis:', err)
    }
  }

  // Function to analyze the extracted text
  const analyzeText = (text, fileName) => {
    if (!text.trim()) {
      setError('No text found in the document.')
      return
    }

    // Load previous analysis for this file
    const previous = loadPreviousAnalysis(fileName)
    setPreviousAnalysis(previous)

    // Basic text analysis
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    
    // Count paragraphs - split by line breaks and filter out empty lines
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0)
    // Estimate paragraphs: count lines with substantial content (more than 10 chars)
    const paragraphs = lines.filter(line => line.trim().length > 10)
    
    // Character counts
    const totalCharacters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    
    // Word analysis
    const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^\w]/g, ''))).size
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    
    // Sentence analysis
    const averageWordsPerSentence = words.length / sentences.length
    const averageSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.trim().length, 0) / sentences.length
    
    // Reading level estimation (Flesch Reading Ease approximation)
    const syllables = words.reduce((count, word) => count + countSyllables(word), 0)
    const fleschScore = 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * (syllables / words.length))
    
    // Common words analysis
    const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']
    const commonWordCount = words.filter(word => 
      commonWords.includes(word.toLowerCase().replace(/[^\w]/g, ''))
    ).length

    const analysisData = {
      wordCount: words.length,
      characterCount: totalCharacters,
      characterCountNoSpaces: charactersNoSpaces,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      uniqueWords: uniqueWords,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 100) / 100,
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      fleschScore: Math.round(fleschScore * 100) / 100,
      commonWordPercentage: Math.round((commonWordCount / words.length) * 100 * 100) / 100,
      readingTime: Math.ceil(words.length / 200) // Assuming 200 words per minute
    }

    setAnalysis(analysisData)
    
    // Save to localStorage for future comparison
    saveAnalysis(fileName, analysisData)
  }

  // Helper function to count syllables
  const countSyllables = (word) => {
    word = word.toLowerCase().replace(/[^\w]/g, '')
    if (word.length <= 3) return 1
    
    const vowels = 'aeiouy'
    let count = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }
    
    // Handle silent 'e'
    if (word.endsWith('e')) count--
    
    return Math.max(1, count)
  }

  // Function to calculate delta from previous analysis
  const calculateDelta = (current, previous, key) => {
    if (!previous || previous[key] === undefined) return null
    return current - previous[key]
  }

  // Function to reset the application
  const resetApp = () => {
    setFile(null)
    setText('')
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
                  <strong>Click to upload</strong> or drag and drop
                </div>
                <div className="upload-subtext">
                  Supports .txt, .pdf, and .docx files
                </div>
              </label>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyzing your document...</p>
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
