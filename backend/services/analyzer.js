import mammoth from 'mammoth'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const PDFParser = require('pdf2json')

// Count syllables in a word
function countSyllables(word) {
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

// Extract text from different file types
async function extractText(buffer, mimetype) {
  let extractedText = ''
  
  if (mimetype === 'text/plain') {
    // Handle text files
    extractedText = buffer.toString('utf-8')
  } else if (mimetype === 'application/pdf') {
    // Handle PDF files (Node.js compatible)
    extractedText = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser()
      
      pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError))
      pdfParser.on('pdfParser_dataReady', pdfData => {
        // Extract text from all pages
        const text = pdfData.Pages.map(page => 
          page.Texts.map(text => 
            text.R.map(r => decodeURIComponent(r.T)).join('')
          ).join(' ')
        ).join('\n')
        resolve(text)
      })
      
      pdfParser.parseBuffer(buffer)
    })
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Handle Word documents (.docx)
    const result = await mammoth.extractRawText({ buffer })
    extractedText = result.value
  } else {
    throw new Error('Unsupported file type. Please upload a .txt, .pdf, or .docx file.')
  }
  
  return extractedText
}

// Analyze text and calculate statistics
export async function analyzeDocument(buffer, mimetype, filename) {
  // Extract text from the document
  const text = await extractText(buffer, mimetype)
  
  if (!text.trim()) {
    throw new Error('No text found in the document.')
  }
  
  // Basic text analysis
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  
  // Count paragraphs - split by line breaks and filter out empty lines
  const lines = text.split(/\n+/).filter(line => line.trim().length > 0)
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
  
  return {
    fileName: filename,
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
    readingTime: Math.ceil(words.length / 200),
    analyzedAt: new Date().toISOString()
  }
}

