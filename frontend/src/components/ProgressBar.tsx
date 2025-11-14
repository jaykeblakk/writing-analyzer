import './ProgressBar.css';

interface ProgressBarProps {
  wordCount: number;
}

const TARGET_WORDS = 100000;

function ProgressBar({ wordCount }: ProgressBarProps) {
  const percentage = Math.min((wordCount / TARGET_WORDS) * 100, 100);
  const remainingWords = Math.max(TARGET_WORDS - wordCount, 0);

  return (
    <div className="progress-container">
      <h2 className="progress-title">Progress to 100,000 Words</h2>
      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          >
            <span className="progress-text">
              {wordCount.toLocaleString()} words
            </span>
          </div>
        </div>
      </div>
      <div className="progress-info">
        <div className="progress-percentage">
          {percentage.toFixed(2)}% Complete
        </div>
        <div className="progress-remaining">
          {remainingWords.toLocaleString()} words remaining
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;

