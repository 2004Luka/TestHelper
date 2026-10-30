import { useState, useEffect, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const currentList = tab === 'active' ? activeQuizzes : deletedQuizzes;

  // Filtered by search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.shareCode?.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const totalSubmissions = useMemo(() => {
    return activeQuizzes.reduce((acc, q) => acc + (q.submissionCount || 0), 0);
  }, [activeQuizzes]);

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
    <div className="page dashboard-page">
      {/* ── Cohesive Page Header with Aligned Actions & Stats ── */}
      <div className="page-header-card">
        <div className="page-header-top-row">
          <div className="page-header-text">
            <div className="page-header-title-flex">
              <h1 className="page-title">{t('dashboardTitle')}</h1>
              {teacher && (
                <span className="page-teacher-pill">
                  {teacher.name} · {teacher.subject}
                </span>
              )}
            </div>
            <p className="page-subtitle">{t('dashboardSub')}</p>
          </div>

          <Link to="/create" className="btn btn-primary btn-header-cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t('navCreate')}</span>
          </Link>
        </div>

        {/* Integrated Header Stats Row */}
        <div className="page-header-metrics">
          <div className="header-metric-item">
            <span className="header-metric-num header-metric-accent">{activeCount}</span>
            <span className="header-metric-label">{t('activeQuizzesLabel')}</span>
          </div>
          <div className="header-metric-sep" />
          <div className="header-metric-item">
            <span className="header-metric-num">{totalSubmissions}</span>
            <span className="header-metric-label">{t('totalSubmissions')}</span>
          </div>
          <div className="header-metric-sep" />
          <div className="header-metric-item">
            <span className="header-metric-num">{activeCount + deletedCount}</span>
            <span className="header-metric-label">{t('totalQuizzes')}</span>
          </div>
          {deletedCount > 0 && (
            <>
              <div className="header-metric-sep" />
              <div className="header-metric-item header-metric-del">
                <span className="header-metric-num">{deletedCount}</span>
                <span className="header-metric-label">{t('recentlyDeleted')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Search Bar Pill ── */}
      <div className="dash-search-container">
        <div className="dash-search-box">
          <svg className="dash-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dash-search-input"
            placeholder={t('searchQuizzes')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="dash-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Quick Access Cards (Inspired by Reference UI) ── */}
      <div className="dash-quick-cards-grid">
        {/* Card 1: Create Quiz Hero */}
        <div className="dash-hero-card dash-hero-card-create">
          <div className="dash-hero-card-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div className="dash-hero-card-content">
            <h3 className="dash-hero-card-title">{t('navCreate')}</h3>
            <p className="dash-hero-card-desc">{t('createQuizHeroDesc')}</p>
          </div>
          <div className="dash-hero-card-footer">
            <span className="dash-hero-card-tag">Word .docx</span>
            <Link to="/create" className="dash-hero-card-circle-btn" aria-label={t('navCreate')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Card 2: Students & Classes Hero */}
        <div className="dash-hero-card dash-hero-card-students">
          <div className="dash-hero-card-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="dash-hero-card-content">
            <h3 className="dash-hero-card-title">{t('navStudents')}</h3>
            <p className="dash-hero-card-desc">{t('studentsHeroDesc')}</p>
          </div>
          <div className="dash-hero-card-footer">
            <span className="dash-hero-card-tag">Rosters & Codes</span>
            <Link to="/students" className="dash-hero-card-circle-btn" aria-label={t('navStudents')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setTab('active');
            setSearchQuery('');
          }}
        >
          <span>{t('activeQuizzes')}</span>
          <span className="tab-badge">{activeCount}</span>
        </button>
        <button
          className={`dashboard-tab ${tab === 'deleted' ? 'active active-deleted' : ''}`}
          onClick={() => {
            setTab('deleted');
            setSearchQuery('');
          }}
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

      {/* ── Quizzes List ── */}
      {filteredList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>
            {searchQuery
              ? 'No matching quizzes found'
              : tab === 'active'
              ? t('noQuizzesFound')
              : t('noDeletedQuizzes')}
          </h3>
          {searchQuery ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          ) : tab === 'active' ? (
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
        <div className="dash-quiz-list">
          {filteredList.map((q) => (
            <div key={q._id} className={`card dash-quiz-card ${tab === 'deleted' ? 'card-deleted' : ''}`}>
              <div className="dash-quiz-card-main">
                <div className="dash-quiz-card-header">
                  <Link
                    to={`/dashboard/${q.shareCode}`}
                    className="dash-quiz-title"
                  >
                    {q.title}
                  </Link>
                  <div className="dash-quiz-status-badge">
                    {tab === 'deleted' ? (
                      <span className="badge badge-deleted-pill">
                        {t('recentlyDeleted')}
                      </span>
                    ) : (
                      <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        ● {q.isActive ? t('quizStatusActive') : t('quizStatusClosed')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dash-quiz-meta-row">
                  <span className="dash-quiz-meta-item">
                    <strong>{q.questions.length}</strong> {t('questionsText')}
                  </span>
                  <span className="dash-quiz-meta-divider">·</span>
                  <span className="dash-quiz-meta-item">
                    <strong>{q.submissionCount}</strong> {t('totalSubmissions')}
                  </span>
                  <span className="dash-quiz-meta-divider">·</span>
                  <span className="dash-quiz-code-badge">{q.shareCode}</span>
                  <span className="dash-quiz-meta-divider">·</span>
                  <span className="dash-quiz-meta-date">
                    {tab === 'deleted' && q.deletedAt
                      ? `${t('deletedOn')}: ${new Date(q.deletedAt).toLocaleDateString()}`
                      : new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Share link box on active items */}
              {tab === 'active' && (
                <div className="share-link-box dash-quiz-share-box">
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

              {/* Responsive Action Buttons */}
              <div className="dash-quiz-actions">
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
                      {t('deletePermanently')}
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
