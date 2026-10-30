import { useState, useEffect, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtered classes & students
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.class?.name?.toLowerCase().includes(q) ||
        s.class?.code?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Initials generator for student avatars
  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="page students-page">
      {/* ── Cohesive Page Header with Aligned Actions & Stats ── */}
      <div className="page-header-card">
        <div className="page-header-top-row">
          <div className="page-header-text">
            <div className="page-header-title-flex">
              <h1 className="page-title">{t('navStudents')}</h1>
              {teacher && (
                <span className="page-teacher-pill">
                  {teacher.name} · {teacher.subject}
                </span>
              )}
            </div>
            <p className="page-subtitle">{t('teacherStudentsSubtitle')}</p>
          </div>

          <button
            className="btn btn-primary btn-header-cta"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError('');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t('createClassBtn')}</span>
          </button>
        </div>

        {/* Integrated Header Stats Row */}
        <div className="page-header-metrics">
          <div className="header-metric-item">
            <span className="header-metric-num header-metric-accent">{classes.length}</span>
            <span className="header-metric-label">{t('totalClasses')}</span>
          </div>
          <div className="header-metric-sep" />
          <div className="header-metric-item">
            <span className="header-metric-num">{students.length}</span>
            <span className="header-metric-label">{t('totalStudents')}</span>
          </div>
        </div>
      </div>

      {/* ── Teacher Direct Registration Link Card ── */}
      {teacher && (
        <div className="card reg-link-card">
          <div className="reg-link-card-header">
            <div>
              <strong className="reg-link-title">
                {t('registrationLinkTitle')}
              </strong>
              <p className="reg-link-desc">
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

          <div className="share-link-box dash-quiz-share-box" style={{ margin: '12px 0 0' }}>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/register?role=student&teacher=${teacher?.id || teacher?._id}`}
              onClick={(e) => e.target.select()}
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
            placeholder={activeTab === 'classes' ? t('searchClasses') : t('searchStudents')}
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

      {/* ── Navigation Sub-Tabs ── */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('classes');
            setSearchQuery('');
          }}
        >
          <span>{t('myClassesTitle')}</span>
          <span className="tab-badge">{classes.length}</span>
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setSearchQuery('');
          }}
        >
          <span>{t('studentListTitle')}</span>
          <span className="tab-badge">{students.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 40 }}>
          <div className="spinner" />
          {t('btnProcessing')}
        </div>
      ) : activeTab === 'classes' ? (
        /* ── Classes View ── */
        <div>
          {filteredClasses.length === 0 ? (
            <div className="card empty-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {searchQuery ? 'No classes match your search' : t('noClassesYet')}
              </p>
              {searchQuery ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('createClassBtn')}
                </button>
              )}
            </div>
          ) : (
            <div className="classes-grid">
              {filteredClasses.map((cls) => (
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
        /* ── Students Roster View (Responsive Table + Mobile Cards) ── */
        <div className="card students-roster-card">
          <div className="card-header-row" style={{ marginBottom: 16 }}>
            <h2>{t('studentListTitle')}</h2>
            <span className="badge badge-accent">{filteredStudents.length} {t('totalLabel')}</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p>{searchQuery ? 'No students match your search' : t('noStudentsYet')}</p>
              {searchQuery && (
                <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 769px) */}
              <div className="students-desktop-table table-responsive">
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
                    {filteredStudents.map((std) => (
                      <tr key={std._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="student-avatar-circle">
                              {getInitials(std.name)}
                            </div>
                            <span style={{ fontWeight: 600 }}>{std.name}</span>
                          </div>
                        </td>
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
                        <td style={{ textAlign: 'right' }}>
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

              {/* Mobile Cards View (<= 768px) Inspired by Schedule/Patient Cards */}
              <div className="students-mobile-cards-list">
                {filteredStudents.map((std) => (
                  <div key={std._id} className="student-mobile-card">
                    <div className="student-mobile-card-top">
                      <div className="student-mobile-card-info">
                        <div className="student-avatar-circle">
                          {getInitials(std.name)}
                        </div>
                        <div>
                          <div className="student-mobile-name">{std.name}</div>
                          <div className="student-mobile-username">@{std.username}</div>
                        </div>
                      </div>
                      <button
                        className="btn-icon-delete"
                        onClick={() => handleRemoveStudent(std._id, std.name)}
                        title="Remove Student"
                        aria-label="Remove Student"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>

                    <div className="student-mobile-card-controls">
                      <div className="student-mobile-class-row">
                        <span className="student-mobile-class-label">{t('currentClass')}:</span>
                        {std.class ? (
                          <span className="badge badge-accent">
                            {std.class.name} ({std.class.code})
                          </span>
                        ) : (
                          <span className="badge badge-off">
                            {t('noClassAssigned')}
                          </span>
                        )}
                      </div>

                      <div className="student-mobile-assign-row">
                        <label className="student-mobile-assign-label">{t('assignClass')}:</label>
                        <select
                          className="table-select student-mobile-select"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Create Class Modal ── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('createClassBtn')}</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="modal-body">
              {createError && (
                <div className="error-message" style={{ marginBottom: 16 }}>
                  {createError}
                </div>
              )}

              <div className="form-group-inline">
                <label>{t('classNameLabel')} *</label>
                <input
                  type="text"
                  placeholder={t('classNamePlaceholder')}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-inline">
                <label>{t('classCodeLabel')}</label>
                <input
                  type="text"
                  placeholder={t('classCodePlaceholder')}
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  maxLength={12}
                  style={{ textTransform: 'uppercase' }}
                />
                <span className="form-help-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('classCodeAutoHelp')}
                </span>
              </div>

              <div className="form-group-inline">
                <label>{t('classDescLabel')}</label>
                <textarea
                  rows={2}
                  placeholder={t('classDescPlaceholder')}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
                  {creatingClass ? t('btnProcessing') : t('createClassBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
