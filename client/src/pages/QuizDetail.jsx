import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import Discussion from '../components/Discussion';

export default function QuizDetail() {
  const { shareCode } = useParams();
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
    // Refresh submissions every 15s
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
          Loading quiz details...
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🚫</div>
          <h3>Quiz not found</h3>
        </div>
      </div>
    );
  }

  // Calculate stats
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
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16 }}>
        <div>
          <h1 className="page-title">{quiz.title}</h1>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>📝 {quiz.questions.length} questions</span>
            <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
              {quiz.isActive ? '● Active' : '● Disabled'}
            </span>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            className={`btn btn-sm ${quiz.isActive ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggle}
          >
            {quiz.isActive ? '🔒 Disable' : '🔓 Enable'}
          </button>
          <a
            href={`/api/submissions/${shareCode}/export`}
            className="btn btn-secondary btn-sm"
            download
          >
            📥 Export CSV
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
          <div className="result-stat-label">Total Submissions</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{uniqueStudents}</div>
          <div className="result-stat-label">Unique Students</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{avgScore}%</div>
          <div className="result-stat-label">Average Score</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{highestScore}%</div>
          <div className="result-stat-label">Highest Score</div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="section-title" style={{ marginTop: 32 }}>👥 Student Submissions</div>

      {submissions.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">👥</div>
          <p>No submissions yet. Share the link with your students!</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Attempt</th>
                <th>Submitted</th>
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
