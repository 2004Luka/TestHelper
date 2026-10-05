import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Discussion from '../components/Discussion';

export default function TakeQuiz() {
  const { shareCode } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [displayQuestions, setDisplayQuestions] = useState([]);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Load quiz
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/quizzes/${shareCode}`);
        setQuiz(res.data);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    load();
  }, [shareCode]);

  // Shuffle helper
  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Start quiz
  const handleStart = () => {
    if (!studentName.trim()) return;
    setStarted(true);

    // Prepare questions (with original indices preserved)
    let qs = quiz.questions.map((q, i) => ({ ...q, originalIndex: i }));
    if (quiz.settings?.shuffleQuestions) {
      qs = shuffleArray(qs);
    }
    setDisplayQuestions(qs);

    // Start timer if set
    if (quiz.settings?.timeLimit > 0) {
      setTimeLeft(quiz.settings.timeLimit * 60);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, result]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = displayQuestions.map((q) => ({
        questionIndex: q.originalIndex,
        selectedAnswer: answers[q.originalIndex] || '',
      }));

      const res = await api.post('/submissions', {
        shareCode,
        studentName: studentName.trim(),
        answers: formattedAnswers,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }, [answers, displayQuestions, shareCode, studentName]);

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <div className="spinner" />
          Loading quiz...
        </div>
      </div>
    );
  }

  // Error state
  if (error && !quiz) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🚫</div>
          <h2>{error}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            This quiz may have been disabled or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // RESULTS VIEW — shown after submission
  if (result) {
    return (
      <div className="page">
        <h1 className="page-title">Quiz Results</h1>
        <p className="page-subtitle">
          {result.studentName} — Attempt #{result.attemptNumber}
        </p>

        <div className="score-circle">
          <span className="score-value">{result.percentage}%</span>
          <span className="score-label">Score</span>
        </div>

        <div className="result-summary">
          <div className="result-stat">
            <div className="result-stat-value">{result.score}</div>
            <div className="result-stat-label">Correct</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-value">{result.totalQuestions - result.score}</div>
            <div className="result-stat-label">Incorrect</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-value">{result.totalQuestions}</div>
            <div className="result-stat-label">Total</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-value">#{result.attemptNumber}</div>
            <div className="result-stat-label">Attempt</div>
          </div>
        </div>

        <div className="section-title">📋 Answer Review</div>

        {result.questions.map((q, i) => (
          <div key={i} className="question-card">
            <div className="question-number">
              Question {i + 1}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.8rem',
                  color: q.isCorrect ? 'var(--success)' : 'var(--error)',
                  fontWeight: 600,
                }}
              >
                {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>
            <div className="question-text">{q.questionText}</div>

            {q.options.length > 0 ? (
              <div className="option-list">
                {q.options.map((opt, j) => {
                  let cls = 'option-item';
                  if (opt === q.correctAnswer) cls += ' correct';
                  else if (opt === q.studentAnswer && !q.isCorrect) cls += ' incorrect';

                  return (
                    <div key={j} className={cls}>
                      <span className="option-letter">{letters[j]}</span>
                      <span>{opt}</span>
                      {opt === q.correctAnswer && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--success)' }}>
                          ✓ Correct answer
                        </span>
                      )}
                      {opt === q.studentAnswer && opt !== q.correctAnswer && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--error)' }}>
                          ✗ Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem' }}>
                <div>
                  Your answer:{' '}
                  <strong style={{ color: q.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                    {q.studentAnswer || '(no answer)'}
                  </strong>
                </div>
                {!q.isCorrect && (
                  <div style={{ color: 'var(--success)', marginTop: 4 }}>
                    Correct answer: <strong>{q.correctAnswer}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setResult(null);
              setAnswers({});
              setStarted(false);
              if (quiz.settings?.timeLimit > 0) {
                setTimeLeft(quiz.settings.timeLimit * 60);
              }
            }}
          >
            🔄 Retake Quiz
          </button>
        </div>

        <Discussion
          shareCode={shareCode}
          currentUser={studentName}
          currentRole="student"
        />
      </div>
    );
  }

  // NAME ENTRY VIEW
  if (!started) {
    return (
      <div className="page">
        <div style={{ maxWidth: 500, margin: '60px auto' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📝</div>
            <h1 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 4 }}>
              {quiz.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {quiz.questions.length} questions
              {quiz.settings?.timeLimit > 0 && ` · ${quiz.settings.timeLimit} min time limit`}
            </p>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Enter your full name to begin</label>
              <input
                className="form-input"
                placeholder="e.g. John Smith"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={!studentName.trim()}
              style={{ width: '100%' }}
            >
              Start Quiz →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ-TAKING VIEW
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{quiz.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {answeredCount} of {displayQuestions.length} answered
          </p>
        </div>

        {timeLeft !== null && (
          <div
            className={`timer ${
              timeLeft <= 60 ? 'danger' : timeLeft <= 300 ? 'warning' : ''
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {displayQuestions.map((q, displayIdx) => (
        <div key={displayIdx} className="question-card">
          <div className="question-number">
            Question {displayIdx + 1}
            <span className="question-type">{q.type}</span>
          </div>
          <div className="question-text">{q.questionText}</div>

          {q.type === 'fillin' ? (
            <input
              className="form-input"
              placeholder="Type your answer..."
              value={answers[q.originalIndex] || ''}
              onChange={(e) => handleAnswer(q.originalIndex, e.target.value)}
            />
          ) : (
            <div className="option-list">
              {q.options.map((opt, j) => (
                <div
                  key={j}
                  className={`option-item ${answers[q.originalIndex] === opt ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.originalIndex, opt)}
                >
                  <span className="option-letter">{letters[j]}</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {answeredCount}/{displayQuestions.length} answered
        </span>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : '✅ Submit Quiz'}
        </button>
      </div>
    </div>
  );
}
