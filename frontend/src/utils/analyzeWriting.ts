/**
 * Analyzes text and returns writing statistics (mirrors backend logic)
 */
export function analyzeWriting(text: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s/g, '').length;

  let paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length <= 1 && text.length > 100) {
    const sentenceEndPattern = /[.!?]\s+(?=[A-Z][a-z])/g;
    const singleNewlineBreaks = text.split(/\n+/).filter((p) => p.trim().length > 20);
    if (singleNewlineBreaks.length > paragraphs.length && singleNewlineBreaks.length < wordCount / 50) {
      paragraphs = singleNewlineBreaks;
    } else {
      const potentialBreaks = text.match(sentenceEndPattern);
      if (potentialBreaks && potentialBreaks.length > 0) {
        paragraphs = text.split(sentenceEndPattern).filter((p) => p.trim().length > 20);
      }
    }
  }
  const paragraphCount = Math.max(paragraphs.length, 1);

  const avgWordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(2) : '0';
  const avgCharsPerWord = wordCount > 0 ? (charCountNoSpaces / wordCount).toFixed(2) : '0';

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
