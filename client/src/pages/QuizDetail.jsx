import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import Discussion from '../components/Discussion';
import { useLanguage } from '../context/LanguageContext';

export default function QuizDetail() {
  const { shareCode } = useParams();
  const { t, lang } = useLanguage();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Mistakes review state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [mistakesOnlyFilter, setMistakesOnlyFilter] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const letters = lang === 'ka'
    ? ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ']
    : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    const load = async () => {
      try {
        const [quizRes, subRes] = await Promise.all([
          api.get(`/quizzes/${shareCode}/full`),
          api.get(`/submissions/${shareCode}`),
        ]);
        setQuiz(quizRes.data);
        setSubmissions(subRes.data);
      } catch {
        // silent
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/submissions/${shareCode}`);
        setSubmissions(res.data);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [shareCode]);

  // Close modal on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedSubmission(null);
    };
    if (selectedSubmission) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSubmission]);

  const handleToggle = async () => {
    try {
      const res = await api.patch(`/quizzes/${shareCode}/toggle`);
      setQuiz(res.data);
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${shareCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = async () => {
    try {
      const rawBase = import.meta.env.VITE_API_URL || '/api';
      const BASE = rawBase.replace(/\/$/, '');
      const token = localStorage.getItem('teacherToken');
      const res = await fetch(`${BASE}/submissions/${shareCode}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quiz.title ? quiz.title.replace(/\s+/g, '_') : 'quiz'}_results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  // Question error breakdown across all submissions
  const questionMistakes = useMemo(() => {
    if (!quiz || !submissions.length) return [];
    return quiz.questions
      .map((q, idx) => {
        let mistakes = 0;
        submissions.forEach((sub) => {
          const a = sub.answers?.find((ans) => ans.questionIndex === idx) || sub.answers?.[idx];
          if (!a || !a.isCorrect) mistakes++;
        });
        return {
          ...q,
          index: idx,
          mistakes,
          missRate: Math.round((mistakes / submissions.length) * 100),
        };
      })
      .sort((a, b) => b.mistakes - a.mistakes);
  }, [quiz, submissions]);

  // Filtered review questions for selected submission
  const reviewQuestions = useMemo(() => {
    if (!quiz || !selectedSubmission) return [];
    const questions = quiz.questions.map((q, idx) => {
      const a = selectedSubmission.answers?.find((ans) => ans.questionIndex === idx) || selectedSubmission.answers?.[idx];
      const isCorrect = a ? Boolean(a.isCorrect) : false;
      const studentAnswer = a?.selectedAnswer || '';
      return {
        ...q,
        index: idx,
        studentAnswer,
        isCorrect,
      };
    });

    if (mistakesOnlyFilter) {
      return questions.filter((q) => !q.isCorrect);
    }
    return questions;
  }, [quiz, selectedSubmission, mistakesOnlyFilter]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <div className="spinner" />
          {t('btnProcessing')}
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <h3>{t('noQuizzesFound')}</h3>
        </div>
      </div>
    );
  }

  const totalSubs = submissions.length;
  const uniqueStudents = new Set(submissions.map((s) => s.studentName)).size;
  const avgScore = totalSubs > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.percentage, 0) / totalSubs)
    : 0;
  const highestScore = totalSubs > 0
    ? Math.max(...submissions.map((s) => s.percentage))
    : 0;

  const totalPossibleQuestions = quiz.questions?.length || 0;

  return (
    <div className="page">
      <Link to="/dashboard" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        ← {t('navDashboard')}
      </Link>

      <div className="page-header" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">{quiz.title}</h1>
          <div className="quiz-meta" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, fontSize: '0.88rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>{totalPossibleQuestions} {t('questionsText')}</span>
            <span>·</span>
            <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
              ● {quiz.isActive ? t('quizStatusActive') : t('quizStatusClosed')}
            </span>
          </div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? t('btnCopied') : t('btnCopy')}
          </button>
          <button
            className={`btn btn-sm ${quiz.isActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggle}
          >
            {quiz.isActive ? t('finishQuizBtn') : t('reopenQuizBtn')}
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="share-link-box">
        <input
          value={`${window.location.origin}/quiz/${shareCode}`}
          readOnly
          onClick={(e) => e.target.select()}
        />
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
          {copied ? t('btnCopied') : t('btnCopy')}
        </button>
      </div>

      {/* Stats */}
      <div className="result-summary" style={{ marginTop: 24 }}>
        <div className="result-stat">
          <div className="result-stat-value">{totalSubs}</div>
          <div className="result-stat-label">{t('totalSubmissions')}</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{uniqueStudents}</div>
          <div className="result-stat-label">{t('studentName')}</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{avgScore}%</div>
          <div className="result-stat-label">{t('score')} (Avg)</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{highestScore}%</div>
          <div className="result-stat-label">{t('score')} (Max)</div>
        </div>
      </div>

      {/* Common Mistakes Breakdown Section */}
      {submissions.length > 0 && (
        <div className="breakdown-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {t('commonMistakesTitle')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {t('commonMistakesSub')}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBreakdown((prev) => !prev)}
            >
              {showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
            </button>
          </div>

          {showBreakdown && (
            <div className="breakdown-grid">
              {questionMistakes.map((qm) => (
                <div key={qm.index} className="breakdown-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {t('questionsText')} {qm.index + 1}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: qm.mistakes > 0 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                      {qm.mistakes} / {totalSubs} {t('studentsMissed')} ({qm.missRate}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {qm.questionText}
                  </div>
                  <div className="breakdown-bar-bg">
                    <div className="breakdown-bar-fill" style={{ width: `${qm.missRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions Table */}
      <div className="section-title" style={{ marginTop: 32 }}>{t('studentResults')}</div>

      {submissions.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">—</div>
          <p>{t('createdSub')}</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('studentName')}</th>
                <th>{t('score')}</th>
                <th>{t('percentage')}</th>
                <th>{t('attemptsCount')}</th>
                <th>{t('dateSubmitted')}</th>
                <th style={{ textAlign: 'right' }}>{t('viewMistakes')}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const mistakesCount = s.totalQuestions - s.score;
                return (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                    <td>
                      {s.score}/{s.totalQuestions}
                    </td>
                    <td>
                      <span
                        style={{
                          color: s.percentage >= 70 ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                      >
                        {s.percentage}%
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-attempt">#{s.attemptNumber}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                          setSelectedSubmission(s);
                          setMistakesOnlyFilter(mistakesCount > 0);
                        }}
                      >
                        <span>{t('viewMistakes')}</span>
                        {mistakesCount > 0 ? (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.18)',
                              color: 'var(--error)',
                              padding: '1px 6px',
                              borderRadius: 999,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {mistakesCount}
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(34, 197, 94, 0.18)',
                              color: 'var(--success)',
                              padding: '1px 6px',
                              borderRadius: 999,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            0
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Discussion */}
      <Discussion shareCode={shareCode} currentUser="Teacher" currentRole="teacher" />

      {/* SUBMISSION MISTAKES REVIEW MODAL */}
      {selectedSubmission && (
        <div className="modal-backdrop" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span>{t('submissionReview')} — {selectedSubmission.studentName}</span>
                <span className="badge badge-attempt" style={{ marginLeft: 6 }}>
                  #{selectedSubmission.attemptNumber}
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedSubmission(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Stat summary bar */}
              <div className="result-summary" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', margin: 0 }}>
                <div className="result-stat" style={{ padding: '12px 14px' }}>
                  <div className="result-stat-value" style={{ fontSize: '1.3rem' }}>
                    {selectedSubmission.score} / {selectedSubmission.totalQuestions}
                  </div>
                  <div className="result-stat-label">{t('score')}</div>
                </div>
                <div className="result-stat" style={{ padding: '12px 14px' }}>
                  <div className="result-stat-value" style={{ fontSize: '1.3rem', color: selectedSubmission.percentage >= 70 ? 'var(--accent)' : 'inherit' }}>
                    {selectedSubmission.percentage}%
                  </div>
                  <div className="result-stat-label">{t('percentage')}</div>
                </div>
                <div className="result-stat" style={{ padding: '12px 14px' }}>
                  <div className="result-stat-value" style={{ fontSize: '1.3rem', color: selectedSubmission.totalQuestions - selectedSubmission.score > 0 ? 'var(--error)' : 'var(--success)' }}>
                    {selectedSubmission.totalQuestions - selectedSubmission.score}
                  </div>
                  <div className="result-stat-label">{t('totalMistakes')}</div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="review-filter-bar">
                <div className="filter-pills">
                  <button
                    className={`filter-pill ${!mistakesOnlyFilter ? 'active' : ''}`}
                    onClick={() => setMistakesOnlyFilter(false)}
                  >
                    {t('allQuestions')} ({quiz.questions.length})
                  </button>
                  <button
                    className={`filter-pill ${mistakesOnlyFilter ? 'active-mistakes' : ''}`}
                    onClick={() => setMistakesOnlyFilter(true)}
                  >
                    {t('mistakesOnly')} ({selectedSubmission.totalQuestions - selectedSubmission.score})
                  </button>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Questions review */}
              {reviewQuestions.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--success)', marginBottom: 8 }}>{t('noMistakesMsg')}</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setMistakesOnlyFilter(false)}
                  >
                    {t('allQuestions')} ({quiz.questions.length})
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviewQuestions.map((q) => (
                    <div
                      key={q.index}
                      className={`review-question-card ${q.isCorrect ? 'is-correct' : 'is-mistake'}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {t('questionsText')} {q.index + 1}
                        </span>
                        <span className={`review-header-badge ${q.isCorrect ? 'badge-correct' : 'badge-mistake'}`}>
                          {q.isCorrect ? `✓ ${t('correct')}` : `✗ ${t('incorrect')}`}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        {q.questionText}
                      </div>

                      {q.options && q.options.length > 0 ? (
                        <div className="option-list" style={{ marginTop: 4 }}>
                          {q.options.map((opt, j) => {
                            let cls = 'option-item';
                            const isCorrectOpt = opt === q.correctAnswer;
                            const isStudentOpt = opt === q.studentAnswer;

                            if (isCorrectOpt) cls += ' correct';
                            else if (isStudentOpt && !q.isCorrect) cls += ' incorrect';

                            return (
                              <div key={j} className={cls}>
                                <span className="option-letter">{letters[j] || (j + 1)}</span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {isCorrectOpt && (
                                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>
                                    ✓ {t('correctAnswerLabel')}
                                  </span>
                                )}
                                {isStudentOpt && !isCorrectOpt && (
                                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--error)', fontWeight: 700 }}>
                                    ✗ {t('studentAnswerLabel')}
                                  </span>
                                )}
                                {isStudentOpt && isCorrectOpt && (
                                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>
                                    ✓ {t('studentAnswerLabel')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="review-answer-box">
                          <div>
                            <span style={{ color: 'var(--text-secondary)', marginRight: 6 }}>{t('studentAnswerLabel')}:</span>
                            <strong style={{ color: q.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                              {q.studentAnswer || `(${t('notAnswered') || 'No answer'})`}
                            </strong>
                          </div>
                          {!q.isCorrect && (
                            <div style={{ marginTop: 4 }}>
                              <span style={{ color: 'var(--text-secondary)', marginRight: 6 }}>{t('correctAnswerLabel')}:</span>
                              <strong style={{ color: 'var(--success)' }}>
                                {q.correctAnswer}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedSubmission(null)}
              >
                {t('closeModal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
