import './StatsDisplay.css';

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

interface StatsDisplayProps {
  stats: WritingStats;
  differences: Differences | null;
}

function StatsDisplay({ stats, differences }: StatsDisplayProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const renderStat = (label: string, value: number, difference: number | null = null) => {
    return (
      <div className="stat-item">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {formatNumber(value)}
          {difference !== null && difference > 0 && (
            <span className="stat-difference positive">
              +{formatNumber(difference)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="stats-display">
      <h2 className="stats-title">Writing Statistics</h2>
      <div className="stats-grid">
        {renderStat('Word Count', stats.wordCount, differences?.wordCount || null)}
        {renderStat('Sentence Count', stats.sentenceCount, differences?.sentenceCount || null)}
        {renderStat('Paragraph Count', stats.paragraphCount, differences?.paragraphCount || null)}
        {renderStat('Character Count', stats.charCount, differences?.charCount || null)}
        {renderStat('Characters (no spaces)', stats.charCountNoSpaces, differences?.charCountNoSpaces || null)}
        <div className="stat-item">
          <div className="stat-label">Avg Words per Sentence</div>
          <div className="stat-value">{stats.avgWordsPerSentence.toFixed(2)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Avg Characters per Word</div>
          <div className="stat-value">{stats.avgCharsPerWord.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default StatsDisplay;

