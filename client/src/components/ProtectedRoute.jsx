import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProtectedRoute({ children }) {
  const { teacher, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        ⏳ Loading...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <div className="card shadow-lg" style={{ padding: '40px 24px', borderRadius: 16 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            {t('authRequiredMsg')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.95rem' }}>
            {t('loginSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              🔑 {t('navLogin')}
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '10px 24px' }}>
              ✨ {t('navRegister')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
