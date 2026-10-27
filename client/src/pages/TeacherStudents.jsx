import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function TeacherStudents() {
  const { t } = useLanguage();
  const { teacher } = useAuth();

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'students'
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // New class modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [createError, setCreateError] = useState('');

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedRegLink, setCopiedRegLink] = useState(false);

  const loadData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/classes/students'),
      ]);
      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setCreatingClass(true);
      setCreateError('');
      await api.post('/classes', {
        name: newClassName.trim(),
        code: newClassCode.trim() ? newClassCode.trim().toUpperCase() : undefined,
        description: newClassDesc.trim(),
      });

      setNewClassName('');
      setNewClassCode('');
      setNewClassDesc('');
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      setCreateError(err.message || 'Failed to create class');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!confirm(`Are you sure you want to delete class "${className}"? Students in this class will become independent.`)) {
      return;
    }

    try {
      await api.del(`/classes/${classId}`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete class');
    }
  };

  const handleAssignClass = async (studentId, classId) => {
    try {
      await api.patch(`/classes/students/${studentId}/assign`, {
        classId: classId || null,
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to reassign class');
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!confirm(t('removeStudentConfirm') + ` (${studentName})`)) return;

    try {
      await api.del(`/classes/students/${studentId}`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to remove student');
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t('navStudents')}</h1>
          <p className="page-subtitle">{t('teacherStudentsSubtitle')}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
        >
          {t('createClassBtn')}
        </button>
      </div>

      {/* Teacher Direct Registration Link Card */}
      {teacher && (
        <div className="card" style={{ marginBottom: 24, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {t('registrationLinkTitle')}
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                {t('registrationLinkDesc')}
              </p>
            </div>
            <Link
              to="/settings"
              className="btn btn-secondary btn-sm"
            >
              {t('profileAndSettings')}
            </Link>
          </div>

          <div className="share-link-box" style={{ margin: '10px 0 0' }}>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/register?role=student&teacher=${teacher?.id || teacher?._id}`}
              onClick={(e) => e.target.select()}
              style={{ fontSize: '0.84rem' }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/register?role=student&teacher=${teacher?.id || teacher?._id}`);
                setCopiedRegLink(true);
                setTimeout(() => setCopiedRegLink(false), 2000);
              }}
            >
              {copiedRegLink ? t('btnCopied') : t('btnCopyLink')}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="dashboard-tabs" style={{ marginBottom: 24 }}>
        <button
          className={`dashboard-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <span>{t('myClassesTitle')}</span>
          <span className="tab-badge">{classes.length}</span>
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <span>{t('studentListTitle')}</span>
          <span className="tab-badge">{students.length}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Loading...
        </div>
      ) : activeTab === 'classes' ? (
        /* Classes View */
        <div>
          {classes.length === 0 ? (
            <div className="card empty-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {t('noClassesYet')}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                {t('createClassBtn')}
              </button>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((cls) => (
                <div key={cls._id} className="card class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    <button
                      className="btn-icon-danger"
                      onClick={() => handleDeleteClass(cls._id, cls.name)}
                      title="Delete Class"
                      aria-label="Delete Class"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  {cls.description && (
                    <p className="class-card-desc">{cls.description}</p>
                  )}

                  <div className="class-code-badge-row">
                    <span className="class-code-label">{t('classCode')}:</span>
                    <span className="class-code-value">{cls.code}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyCode(cls.code)}
                      title="Copy Class Code"
                    >
                      {copiedCode === cls.code ? t('btnCopied') : t('copyClassCode')}
                    </button>
                  </div>

                  <div className="class-card-footer">
                    <span className="badge badge-accent">
                      {cls.studentCount || 0} {t('studentsCount')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Students Roster View */
        <div className="card">
          <div className="card-header-row" style={{ marginBottom: 16 }}>
            <h2>{t('studentListTitle')}</h2>
            <span className="badge badge-accent">{students.length} {t('totalLabel')}</span>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p>{t('noStudentsYet')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('studentFullName')}</th>
                    <th>{t('username')}</th>
                    <th>{t('currentClass')}</th>
                    <th>{t('assignClass')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((std) => (
                    <tr key={std._id}>
                      <td style={{ fontWeight: 600 }}>{std.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>@{std.username}</td>
                      <td>
                        {std.class ? (
                          <span className="badge badge-accent">
                            {std.class.name} ({std.class.code})
                          </span>
                        ) : (
                          <span className="badge badge-off">
                            {t('noClassAssigned')}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          className="table-select"
                          value={std.class?._id || ''}
                          onChange={(e) => handleAssignClass(std._id, e.target.value)}
                        >
                          <option value="">{t('noClassAssigned')}</option>
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-icon-delete"
                          onClick={() => handleRemoveStudent(std._id, std.name)}
                          title="Remove Student"
                          aria-label="Remove Student"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('createClassBtn')}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="inline-alert inline-alert-error" style={{ marginBottom: 16 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClass}>
              <div className="form-group-inline">
                <label>{t('classNameLabel')}</label>
                <input
                  type="text"
                  placeholder={t('classNamePlaceholder')}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group-inline">
                <label>{t('classCodeLabel')}</label>
                <input
                  type="text"
                  placeholder="e.g. 10A-MATH"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group-inline">
                <label>{t('classDescLabel')}</label>
                <input
                  type="text"
                  placeholder="Optional notes or semester details"
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('btnCancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingClass}
                >
                  {creatingClass ? '...' : t('saveClassBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
