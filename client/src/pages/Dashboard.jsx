import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const { teacher } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = async () => {
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleToggle = async (shareCode) => {
    try {
      await api.patch(`/quizzes/${shareCode}/toggle`);
      loadQuizzes();
    } catch {
      // silent
    }
  };

  const handleDelete = async (shareCode) => {
    if (!confirm('Delete this quiz and all submissions?')) return;
    try {
      await api.del(`/quizzes/${shareCode}`);
      loadQuizzes();
    } catch {
      // silent
    }
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

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            {t('dashboardTitle')} {teacher ? `(${teacher.name} • ${teacher.subject})` : ''}
          </h1>
          <p className="page-subtitle">{t('dashboardSub')}</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          ✨ {t('navCreate')}
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>{t('noQuizzesFound')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
            {t('createSubtitle')}
          </p>
          <Link to="/create" className="btn btn-primary">
            {t('navCreate')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {quizzes.map((q) => (
            <div key={q._id} className="card">
              <div className="card-header">
                <div>
                  <Link
                    to={`/dashboard/${q.shareCode}`}
                    style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}
                  >
                    {q.title}
                  </Link>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>📝 {q.questions.length} {t('questionsText')}</span>
                    <span>👥 {q.submissionCount} {t('totalSubmissions')}</span>
                    <span>🔑 {q.shareCode}</span>
                    <span>📅 {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {q.isActive ? `● ${t('quizStatusActive')}` : `● ${t('quizStatusClosed')}`}
                  </span>
                </div>
              </div>

              <div className="btn-group">
                <Link to={`/dashboard/${q.shareCode}`} className="btn btn-secondary btn-sm">
                  📊 {t('studentResults')}
                </Link>
                <button
                  className={`btn btn-sm ${q.isActive ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => handleToggle(q.shareCode)}
                >
                  {q.isActive ? t('finishQuizBtn') : t('reopenQuizBtn')}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/quiz/${q.shareCode}`
                    );
                  }}
                >
                  {t('btnCopy')}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(q.shareCode)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
