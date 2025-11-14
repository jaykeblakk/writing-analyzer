import { useState } from 'react';
import FileUpload from './components/FileUpload';
import StatsDisplay from './components/StatsDisplay';
import ProgressBar from './components/ProgressBar';
import './App.css';

interface WritingStats {
  wordCount: number;
  sentenceCount: number;
  charCount: number;
  charCountNoSpaces: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
}

interface Differences {
  wordCount: number;
  sentenceCount: number;
  charCount: number;
  charCountNoSpaces: number;
  paragraphCount: number;
}

interface AnalysisResult {
  stats: WritingStats;
  differences: Differences | null;
  previousUpload: { wordCount: number; timestamp: string } | null;
}

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalysisResult(null);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Writing Analyzer</h1>
          <p className="subtitle">Analyze your writing and track your progress</p>
        </header>

        <FileUpload
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          onLoading={handleLoading}
        />

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing your document...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {analysisResult && (
          <>
            <StatsDisplay
              stats={analysisResult.stats}
              differences={analysisResult.differences}
            />
            <ProgressBar wordCount={analysisResult.stats.wordCount} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;

