import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function StudentDashboard() {
  const { student, updateStudentClass } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join class modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const loadQuizzes = async () => {
    try {
      const res = await api.get('/students/my-quizzes');
      setQuizzes(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCodeInput.trim()) return;

    try {
      setJoinLoading(true);
      setJoinError('');
      setJoinSuccess('');

      const res = await api.post('/students/join-class', {
        classCode: classCodeInput.trim().toUpperCase(),
      });

      if (res.data?.class) {
        updateStudentClass(res.data.class);
      }
      setJoinSuccess(res.message || 'Joined class successfully!');
      setClassCodeInput('');
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess('');
      }, 1500);

      await loadQuizzes();
    } catch (err) {
      setJoinError(err.message || 'Failed to join class. Please check the code.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t('navStudentPortal')}</h1>
          <p className="page-subtitle">{t('myTestsSubtitle')}</p>
        </div>
      </div>

      {/* Student Welcome & Profile Card */}
      <div className="card student-profile-card">
        <div className="student-profile-info">
          <div className="student-avatar-badge">
            {student?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>{student?.name || 'Student'}</h2>
            <p className="student-username-tag">@{student?.username}</p>
          </div>
        </div>

        <div className="student-profile-meta">
          <div className="meta-item">
            <span className="meta-label">{t('currentTeacher')}</span>
            <span className="meta-val">
              {student?.teacher?.name || 'Assigned Teacher'}
              {student?.teacher?.subject && ` (${student.teacher.subject})`}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">{t('currentClass')}</span>
            <span className="meta-val">
              {student?.class ? (
                <span className="badge badge-accent">
                  {student.class.name} ({student.class.code})
                </span>
              ) : (
                <span className="badge badge-off">{t('noClassAssigned')}</span>
              )}
            </span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowJoinModal(true);
              setJoinError('');
              setJoinSuccess('');
            }}
          >
            + {t('joinClassBtn')}
          </button>
        </div>
      </div>

      {/* Tests Header */}
      <div className="section-title" style={{ marginTop: 32, marginBottom: 18, justifyContent: 'space-between' }}>
        <span>{t('myTestsTitle')}</span>
        <span className="badge badge-accent">{quizzes.length} {t('testsCount')}</span>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Loading tests...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="card empty-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{t('noTestsAvailable')}</p>
        </div>
      ) : (
        <div className="student-quizzes-grid">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className={`card quiz-card ${!quiz.isOpen ? 'quiz-card-closed' : ''}`}>
              <div className="quiz-card-top">
                <span className={`badge ${quiz.isOpen ? 'badge-success' : 'badge-danger'}`}>
                  {quiz.isOpen ? t('testStatusOpen') : t('testStatusClosed')}
                </span>
                {quiz.timeLimit > 0 && (
                  <span className="badge badge-off">{quiz.timeLimit}m</span>
                )}
              </div>

              <h3 className="quiz-card-title">{quiz.title}</h3>

              {quiz.submissionsCount > 0 ? (
                <div className="quiz-score-summary">
                  <div className="score-badge-row">
                    <span>{t('bestScoreLabel')}:</span>
                    <strong>
                      {quiz.bestScore} / {quiz.totalQuestions} ({quiz.percentage}%)
                    </strong>
                  </div>
                  <div className="attempts-count-row">
                    <span>{t('attemptsLabel')}:</span>
                    <span>{quiz.submissionsCount}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0' }}>
                  {t('noAttemptsYet')}
                </p>
              )}

              <div className="quiz-card-actions">
                {quiz.isOpen ? (
                  <Link
                    to={`/quiz/${quiz.shareCode}`}
                    className="btn btn-primary"
                    style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                  >
                    {t('takeTestBtn')}
                  </Link>
                ) : (
                  <button
                    className="btn btn-secondary"
                    disabled
                    style={{ width: '100%', opacity: 0.6 }}
                  >
                    {t('testStatusClosed')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('joinClassModalTitle')}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              {t('joinClassModalSub')}
            </p>

            {joinError && (
              <div className="inline-alert inline-alert-error" style={{ marginBottom: 16 }}>
                {joinError}
              </div>
            )}
            {joinSuccess && (
              <div className="inline-alert inline-alert-success" style={{ marginBottom: 16 }}>
                {joinSuccess}
              </div>
            )}

            <form onSubmit={handleJoinClass}>
              <div className="form-group-inline">
                <label>{t('classCode')}</label>
                <input
                  type="text"
                  placeholder="e.g. 10A-MATH"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value)}
                  style={{ textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJoinModal(false)}
                >
                  {t('btnCancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={joinLoading}
                >
                  {joinLoading ? '...' : t('joinClassSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
