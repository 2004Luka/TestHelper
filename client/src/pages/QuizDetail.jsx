import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import Discussion from '../components/Discussion';
import { useLanguage } from '../context/LanguageContext';

export default function QuizDetail() {
  const { shareCode } = useParams();
  const { t } = useLanguage();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="page">
      <Link to="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        ← {t('navDashboard')}
      </Link>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">{quiz.title}</h1>
          <div className="quiz-meta">
            <span>{quiz.questions.length} {t('questionsText')}</span>
            <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
              {quiz.isActive ? `● ${t('quizStatusActive')}` : `● ${t('quizStatusClosed')}`}
            </span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? t('btnCopied') : t('btnCopy')}
          </button>
          <button
            className={`btn btn-sm ${quiz.isActive ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggle}
          >
            {quiz.isActive ? t('finishQuizBtn') : t('reopenQuizBtn')}
          </button>
          <a
            href={`/api/submissions/${shareCode}/export`}
            className="btn btn-secondary btn-sm"
            download
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="share-link-box">
        <input value={`${window.location.origin}/quiz/${shareCode}`} readOnly />
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
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                  <td>
                    {s.score}/{s.totalQuestions}
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          s.percentage >= 70
                            ? 'var(--success)'
                            : s.percentage >= 50
                            ? 'var(--warning)'
                            : 'var(--error)',
                        fontWeight: 600,
                      }}
                    >
                      {s.percentage}%
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-attempt">#{s.attemptNumber}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discussion */}
      <Discussion shareCode={shareCode} currentUser="Teacher" currentRole="teacher" />
    </div>
  );
}
