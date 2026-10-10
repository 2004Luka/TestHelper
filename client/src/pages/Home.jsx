import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <div className="hero">
        <h1 className="hero-title">
          {t('homeTitle')}
        </h1>
        <p className="hero-subtitle">
          {t('homeSubtitle')}
        </p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            {t('homeGetStarted')}
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            {t('navDashboard')}
          </Link>
        </div>
      </div>

      <div className="feature-grid">
        <div className="card feature-card">
          <div className="feature-icon">1</div>
          <div className="feature-title">{t('feature1Title')}</div>
          <div className="feature-desc">
            {t('feature1Desc')}
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">2</div>
          <div className="feature-title">{t('feature2Title')}</div>
          <div className="feature-desc">
            {t('feature2Desc')}
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">3</div>
          <div className="feature-title">{t('feature3Title')}</div>
          <div className="feature-desc">
            {t('feature3Desc')}
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">4</div>
          <div className="feature-title">{t('feature4Title')}</div>
          <div className="feature-desc">
            {t('feature4Desc')}
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">5</div>
          <div className="feature-title">{t('discussionTitle')}</div>
          <div className="feature-desc">
            {t('discussionSub')}
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">6</div>
          <div className="feature-title">{t('showScoreImmediately')}</div>
          <div className="feature-desc">
            {t('homeSubtitle')}
          </div>
        </div>
      </div>
    </div>
  );
}
