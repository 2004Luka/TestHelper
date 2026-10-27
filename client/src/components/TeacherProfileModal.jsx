import { useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function TeacherProfileModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { teacher, updateTeacherProfile } = useAuth();

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !teacher) return null;

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: '92%' }}
      >
        <div className="modal-header">
          <h3>{t('profileAndSettings')}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Teacher Info Summary */}
          <div className="teacher-profile-summary">
            <div className="student-avatar-badge" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
              {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {teacher.name}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {teacher.subject}
              </div>
            </div>
          </div>

          {/* Direct Registration Link Section */}
          <div className="settings-section-box">
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, color: 'var(--text-primary)' }}>
              {t('registrationLinkTitle')}
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
              {t('registrationLinkDesc')}
            </p>
            <div className="share-link-box" style={{ margin: 0 }}>
              <input
                type="text"
                readOnly
                value={registrationLink}
                onClick={(e) => e.target.select()}
                style={{ fontSize: '0.84rem' }}
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

          {/* Settings Section: Visibility in registration list */}
          <div className="settings-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t('showInRegListLabel')}
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  {t('showInRegListSub')}
                </p>
              </div>

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

            {saveSuccess && (
              <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--success)', fontWeight: 500 }}>
                {t('settingsSaved')}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            {t('btnCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
