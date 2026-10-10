/**
 * Previews parsed quiz questions before generating the link.
 * Props: questions (array)
 */
import { useLanguage } from '../context/LanguageContext';

export default function QuizPreview({ questions }) {
  const { lang, t } = useLanguage();
  if (!questions || questions.length === 0) return null;

  const letters = lang === 'ka'
    ? ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ']
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div style={{ marginTop: 24 }}>
      <div className="section-title">Preview ({questions.length} questions)</div>
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <div className="question-number">
            Question {i + 1}
            <span className="question-type">{q.type}</span>
          </div>
          <div className="question-text">{q.questionText}</div>

          {q.options.length > 0 && (
            <div className="option-list">
              {q.options.map((opt, j) => (
                <div
                  key={j}
                  className={`option-item ${opt === q.correctAnswer ? 'correct' : ''}`}
                >
                  <span className="option-letter">{letters[j]}</span>
                  <span>{opt}</span>
                  {opt === q.correctAnswer && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {q.type === 'fillin' && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
              ✓ Answer: {q.correctAnswer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
