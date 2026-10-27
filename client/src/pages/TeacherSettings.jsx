import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function TeacherSettings() {
  const { t } = useLanguage();
  const { teacher, updateTeacherProfile } = useAuth();

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!teacher) return null;

  const teacherId = teacher.id || teacher._id;
  const registrationLink = `${window.location.origin}/register?role=student&teacher=${teacherId}`;
  const showInList = teacher.showInRegistrationList !== false;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleShowInList = async () => {
    const newValue = !showInList;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const res = await api.patch('/auth/settings', {
        showInRegistrationList: newValue,
      });
      if (res?.teacher) {
        updateTeacherProfile({ showInRegistrationList: res.teacher.showInRegistrationList });
      } else {
        updateTeacherProfile({ showInRegistrationList: newValue });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 880, margin: '0 auto' }}>
      <Link to="/dashboard" className="back-link">
        ← {t('navDashboard')}
      </Link>

      <div className="page-header" style={{ marginTop: 16, marginBottom: 28 }}>
        <div>
          <h1 className="page-title">{t('profileAndSettings')}</h1>
          <p className="page-subtitle">{t('teacherSettingsSubtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div
              className="student-avatar-badge"
              style={{
                width: 64,
                height: 64,
                fontSize: '1.6rem',
                flexShrink: 0,
              }}
            >
              {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)' }}>
                  {teacher.name}
                </h2>
                <span className="badge badge-accent">{t('teacherRoleLabel')}</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {teacher.subject}
              </div>
            </div>
          </div>
        </div>

        {/* Student Direct Registration Link Card */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              {t('registrationLinkTitle')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {t('registrationLinkDesc')}
            </p>
          </div>

          <div className="share-link-box" style={{ margin: '16px 0 8px' }}>
            <input
              type="text"
              readOnly
              value={registrationLink}
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyLink}
            >
              {copied ? t('btnCopied') : t('btnCopyLink')}
            </button>
          </div>
        </div>

        {/* Visibility Preferences Card */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              {t('regSettingsTitle')}
            </h2>
          </div>

          <div
            className="settings-section-box"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                {t('showInRegListLabel')}
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {t('showInRegListSub')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {saveSuccess && (
                <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                  {t('settingsSaved')}
                </span>
              )}
              <label className="toggle-switch-container">
                <input
                  type="checkbox"
                  checked={showInList}
                  onChange={handleToggleShowInList}
                  disabled={saving}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', flexWrap: 'wrap', marginTop: 8 }}>
          <Link to="/students" className="btn btn-secondary btn-sm">
            {t('navStudents')}
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            {t('navDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
