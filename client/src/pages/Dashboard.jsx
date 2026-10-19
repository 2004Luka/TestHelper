import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const { teacher } = useAuth();
  const [tab, setTab] = useState('active'); // 'active' | 'deleted'
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [deletedQuizzes, setDeletedQuizzes] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (shareCode, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${shareCode}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadQuizzes = async (currentTab = tab) => {
    try {
      const isDel = currentTab === 'deleted';
      const res = await api.get(`/quizzes?deleted=${isDel}`);
      if (isDel) {
        setDeletedQuizzes(res.data || []);
      } else {
        setActiveQuizzes(res.data || []);
      }
      if (typeof res.activeCount === 'number') setActiveCount(res.activeCount);
      if (typeof res.deletedCount === 'number') setDeletedCount(res.deletedCount);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuizzes(tab);
  }, [tab]);

  const handleToggle = async (shareCode) => {
    try {
      await api.patch(`/quizzes/${shareCode}/toggle`);
      loadQuizzes(tab);
    } catch {
      // silent
    }
  };

  // First time delete: soft deletes to Recently Deleted section
  const handleSoftDelete = async (shareCode) => {
    if (!confirm(t('confirmSoftDeleteQuiz'))) return;
    try {
      await api.del(`/quizzes/${shareCode}`);
      loadQuizzes('active');
    } catch {
      // silent
    }
  };

  // Restore quiz back to active list
  const handleRestore = async (shareCode) => {
    try {
      await api.patch(`/quizzes/${shareCode}/restore`);
      loadQuizzes('deleted');
    } catch {
      // silent
    }
  };

  // Permanent delete from recently deleted section
  const handlePermanentDelete = async (shareCode) => {
    if (!confirm(t('confirmPermanentDeleteQuiz'))) return;
    try {
      await api.del(`/quizzes/${shareCode}?permanent=true`);
      loadQuizzes('deleted');
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

  const currentList = tab === 'active' ? activeQuizzes : deletedQuizzes;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            {t('dashboardTitle')} {teacher ? `(${teacher.name} • ${teacher.subject})` : ''}
          </h1>
          <p className="page-subtitle">{t('dashboardSub')}</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          + {t('navCreate')}
        </Link>
      </div>

      {/* Tabs navigation */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          <span>{t('activeQuizzes')}</span>
          <span className="tab-badge">{activeCount}</span>
        </button>
        <button
          className={`dashboard-tab ${tab === 'deleted' ? 'active active-deleted' : ''}`}
          onClick={() => setTab('deleted')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <span>{t('recentlyDeleted')}</span>
          {deletedCount > 0 && <span className="tab-badge">{deletedCount}</span>}
        </button>
      </div>

      {/* Tab: Recently Deleted notice */}
      {tab === 'deleted' && (
        <div className="recently-deleted-notice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>{t('recentlyDeletedSub')}</div>
        </div>
      )}

      {currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <h3>{tab === 'active' ? t('noQuizzesFound') : t('noDeletedQuizzes')}</h3>
          {tab === 'active' ? (
            <>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                {t('createSubtitle')}
              </p>
              <Link to="/create" className="btn btn-primary">
                {t('navCreate')}
              </Link>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              {t('recentlyDeletedSub')}
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {currentList.map((q) => (
            <div key={q._id} className={`card ${tab === 'deleted' ? 'card-deleted' : ''}`}>
              <div className="card-header">
                <div>
                  <Link
                    to={`/dashboard/${q.shareCode}`}
                    style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}
                  >
                    {q.title}
                  </Link>
                  <div className="quiz-meta" style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>{q.questions.length} {t('questionsText')}</span>
                    <span>·</span>
                    <span>{q.submissionCount} {t('totalSubmissions')}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{q.shareCode}</span>
                    <span>·</span>
                    <span>
                      {tab === 'deleted' && q.deletedAt
                        ? `${t('deletedOn')}: ${new Date(q.deletedAt).toLocaleDateString()}`
                        : new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tab === 'deleted' ? (
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      🗑 {t('recentlyDeleted')}
                    </span>
                  ) : (
                    <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      ● {q.isActive ? t('quizStatusActive') : t('quizStatusClosed')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quiz Link with Copy Button (only shown for active quizzes) */}
              {tab === 'active' && (
                <div className="share-link-box" style={{ marginTop: 12 }}>
                  <input
                    value={`${window.location.origin}/quiz/${q.shareCode}`}
                    readOnly
                    onClick={(e) => e.target.select()}
                    title="Quiz Link"
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(q.shareCode, q._id)}
                  >
                    {copiedId === q._id ? t('btnCopied') : t('btnCopy')}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="btn-group" style={{ marginTop: 12 }}>
                <Link to={`/dashboard/${q.shareCode}`} className="btn btn-secondary btn-sm">
                  {t('studentResults')} ({q.submissionCount})
                </Link>

                {tab === 'active' ? (
                  <>
                    <button
                      className={`btn btn-sm ${q.isActive ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleToggle(q.shareCode)}
                    >
                      {q.isActive ? t('finishQuizBtn') : t('reopenQuizBtn')}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(q.shareCode, q._id)}
                    >
                      {copiedId === q._id ? t('btnCopied') : t('btnCopy')}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleSoftDelete(q.shareCode)}
                    >
                      {t('deleteQuiz')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-restore btn-sm"
                      onClick={() => handleRestore(q.shareCode)}
                    >
                      ↻ {t('restoreQuiz')}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handlePermanentDelete(q.shareCode)}
                    >
                      ✕ {t('deletePermanently')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

