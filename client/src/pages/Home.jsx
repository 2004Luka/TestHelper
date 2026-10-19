import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="page home-page">
      <div className="hero">
        <div className="hero-badge">
          <span className="badge-pulse"></span>
          <span>POWERED BY QUIZZUP ENGINE</span>
        </div>

        <div className="hero-logo-wrapper" style={{ margin: '16px 0 24px' }}>
          <Logo size="xl" showText={true} />
        </div>

        <h1 className="hero-title">
          {t('homeTitle')}
        </h1>
        <p className="hero-subtitle">
          {t('homeSubtitle')}
        </p>

        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg hero-btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('homeGetStarted')}
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg hero-btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {t('navDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
