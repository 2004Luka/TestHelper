import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProtectedRoute({ children }) {
  const { teacher, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="auth-container" style={{ maxWidth: 500 }}>
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem' }}>
            {t('authRequiredMsg')}
          </h2>
          <p className="auth-subtitle">
            {t('loginSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              {t('navLogin')}
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '10px 24px' }}>
              {t('navRegister')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
