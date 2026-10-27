import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function QuizAccessControl({ shareCode }) {
  const { t } = useLanguage();

  const [accessData, setAccessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'students'

  const loadAccessData = async () => {
    try {
      const res = await api.get(`/classes/quiz-access/${shareCode}`);
      setAccessData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessData();
  }, [shareCode]);

  const handleUpdate = async (payload) => {
    try {
      setUpdating(true);
      const res = await api.patch(`/classes/quiz-access/${shareCode}`, payload);
      setAccessData(res.data);
    } catch (err) {
      alert(err.message || 'Failed to update access settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="card access-control-card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
        Loading access settings...
      </div>
    );
  }

  if (!accessData) return null;

  const filteredStudents = (accessData.students || []).filter((std) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      std.name?.toLowerCase().includes(q) ||
      std.username?.toLowerCase().includes(q) ||
      std.class?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="card access-control-card" style={{ marginTop: 24 }}>
      <div className="access-control-header">
        <div>
          <h2>
            {t('quizAccessTitle')}
          </h2>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            {t('quizAccessSub')}
          </p>
        </div>
      </div>

      {/* Access Mode Selector */}
      <div className="access-mode-selector" style={{ marginTop: 16 }}>
        <label className="access-mode-label">{t('accessModeLabel')}:</label>
        <div className="access-mode-buttons">
          <button
            type="button"
            className={`access-mode-btn ${accessData.accessMode === 'public' ? 'active' : ''}`}
            onClick={() => handleUpdate({ accessMode: 'public' })}
            disabled={updating}
          >
            {t('accessModePublic')}
          </button>
          <button
            type="button"
            className={`access-mode-btn ${accessData.accessMode === 'classes' ? 'active' : ''}`}
            onClick={() => handleUpdate({ accessMode: 'classes' })}
            disabled={updating}
          >
            {t('accessModeClasses')}
          </button>
          <button
            type="button"
            className={`access-mode-btn ${accessData.accessMode === 'restricted' ? 'active' : ''}`}
            onClick={() => handleUpdate({ accessMode: 'restricted' })}
            disabled={updating}
          >
            {t('accessModeRestricted')}
          </button>
        </div>
      </div>

      {/* Inner Tabs: Classes vs Students */}
      <div className="dashboard-tabs" style={{ marginTop: 24, marginBottom: 16 }}>
        <button
          className={`dashboard-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <span>{t('myClassesTitle')}</span>
          <span className="tab-badge">{accessData.classes?.length || 0}</span>
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <span>{t('studentPermissionsTitle')}</span>
          <span className="tab-badge">{accessData.students?.length || 0}</span>
        </button>
      </div>

      {activeTab === 'classes' ? (
        /* Whole Class Access List */
        <div className="classes-access-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {t('toggleClassAvailability')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleUpdate({ openAllClasses: true })}
                disabled={updating}
              >
                {t('openAllClassesBtn')}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleUpdate({ closeAllClasses: true })}
                disabled={updating}
              >
                {t('closeAllClassesBtn')}
              </button>
            </div>
          </div>

          {accessData.classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              {t('noClassesYet')}
            </div>
          ) : (
            <div className="classes-access-grid">
              {accessData.classes.map((cls) => (
                <div key={cls._id} className={`class-access-item ${cls.isOpen ? 'open' : 'closed'}`}>
                  <div className="class-access-info">
                    <strong>{cls.name}</strong>
                    <span className="badge badge-off" style={{ marginLeft: 8 }}>
                      {cls.code}
                    </span>
                  </div>
                  <button
                    className={`btn btn-sm ${cls.isOpen ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleUpdate({ toggleClassId: cls._id, openClass: !cls.isOpen })}
                    disabled={updating}
                  >
                    {cls.isOpen ? t('closeForClass') : t('openForClass')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Individual Student Access List */
        <div className="students-access-section">
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder={t('searchStudentPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              {t('noStudentsYet')}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('studentFullName')}</th>
                    <th>{t('currentClass')}</th>
                    <th>{t('status')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((std) => (
                    <tr key={std._id}>
                      <td>
                        <strong>{std.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          @{std.username}
                        </div>
                      </td>
                      <td>
                        {std.class ? (
                          <span className="badge badge-accent">
                            {std.class.name}
                          </span>
                        ) : (
                          <span className="badge badge-off">
                            {t('noClassAssigned')}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            std.effectiveAccess ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {std.effectiveAccess ? t('accessAllowed') : t('accessBlocked')}
                        </span>
                        {std.isExplicitlyAllowed && (
                          <span className="badge badge-accent" style={{ marginLeft: 6, fontSize: '0.72rem' }}>
                            {t('overrideOpen')}
                          </span>
                        )}
                        {std.isExplicitlyBlocked && (
                          <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: '0.72rem' }}>
                            {t('overrideBlocked')}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className={`btn btn-sm ${std.isExplicitlyAllowed ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() =>
                              handleUpdate({
                                toggleStudentId: std._id,
                                studentAction: 'open',
                              })
                            }
                            disabled={updating}
                            title="Always grant access to this student"
                          >
                            {t('grantAccessBtn')}
                          </button>
                          <button
                            className={`btn btn-sm ${std.isExplicitlyBlocked ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() =>
                              handleUpdate({
                                toggleStudentId: std._id,
                                studentAction: 'close',
                              })
                            }
                            disabled={updating}
                            title="Block access for this student"
                          >
                            {t('blockAccessBtn')}
                          </button>
                          {(std.isExplicitlyAllowed || std.isExplicitlyBlocked) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                handleUpdate({
                                  toggleStudentId: std._id,
                                  studentAction: 'reset',
                                })
                              }
                              disabled={updating}
                              title="Reset to default class rule"
                            >
                              {t('resetToClassBtn')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
