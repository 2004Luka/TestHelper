/**
 * Previews parsed quiz questions before generating the link.
 * Props: questions (array)
 */
import { useLanguage } from '../context/LanguageContext';

export default function QuizPreview({ questions, editable = false, onQuestionChange }) {
  const { lang, t } = useLanguage();
  if (!questions || questions.length === 0) return null;

  const letters = lang === 'ka'
    ? ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ']
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  const updateQuestion = (index, changes) => {
    onQuestionChange?.(index, { ...questions[index], ...changes });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div className="section-title">Preview ({questions.length} questions)</div>
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <div className="question-number">
            Question {i + 1}
            <span className="question-type">{q.type}</span>
          </div>
          {editable ? (
            <textarea
              className="form-input"
              aria-label={`${t('questionTextLabel')} ${i + 1}`}
              value={q.questionText}
              onChange={(e) => updateQuestion(i, { questionText: e.target.value })}
              rows={2}
            />
          ) : (
            <div className="question-text">{q.questionText}</div>
          )}

          {q.options?.length > 0 && (
            <div className="option-list">
              {q.options.map((opt, j) => (
                <div
                  key={j}
                  className={`option-item ${opt === q.correctAnswer ? 'correct' : ''}`}
                  onClick={(event) => {
                    if (editable && !event.target.closest('button')) {
                      updateQuestion(i, { correctAnswer: opt });
                    }
                  }}
                >
                  <span className="option-letter">{letters[j]}</span>
                  {editable ? (
                    <>
                      <input
                        className="form-input"
                        aria-label={`${t('answerOptionsLabel')} ${i + 1}, ${j + 1}`}
                        value={opt}
                        onFocus={() => updateQuestion(i, { correctAnswer: opt })}
                        onChange={(e) => {
                          const options = [...q.options];
                          options[j] = e.target.value;
                          updateQuestion(i, {
                            options,
                            correctAnswer: q.correctAnswer === opt ? e.target.value : q.correctAnswer,
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`${t('removeOptionBtn')} ${j + 1}`}
                        disabled={q.options.length <= 1}
                        onClick={() => {
                          const options = q.options.filter((_, optionIndex) => optionIndex !== j);
                          updateQuestion(i, {
                            options,
                            correctAnswer: opt === q.correctAnswer ? (options[0] || '') : q.correctAnswer,
                          });
                        }}
                      >
                        {t('removeOptionBtn')}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="option-text">{opt}</span>
                      {opt === q.correctAnswer && (
                        <span className="option-badge">✓ Correct</span>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={q.options.some((option) => !option.trim())}
                  onClick={() => updateQuestion(i, { options: [...q.options, ''] })}
                >
                  {t('addOptionBtn')}
                </button>
              )}
            </div>
          )}

          {(q.type === 'fillin' || !q.options?.length) && editable ? (
            <div className="form-group">
              <label className="form-label" htmlFor={`correct-answer-${i}`}>
                {t('correctAnswerLabel')}
              </label>
              <input
                id={`correct-answer-${i}`}
                className="form-input"
                value={q.correctAnswer || ''}
                onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
              />
            </div>
          ) : q.type === 'fillin' && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
              ✓ Answer: {q.correctAnswer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
