import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Dashboard from './pages/Dashboard';
import QuizDetail from './pages/QuizDetail';

import { useLanguage } from './context/LanguageContext';

function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLanguage, t } = useLanguage();

  // Show language switcher even on student quiz page
  const isStudentQuiz = pathname.startsWith('/quiz/');

  if (isStudentQuiz) {
    return (
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleLanguage}
          title="Switch Language / ენის შეცვლა"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          {lang === 'ka' ? '🇬🇪 ქართული' : '🇺🇸 English'}
        </button>
      </div>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">Q</span>
          QuizGen
        </Link>
        <div className="navbar-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>
            {t('navHome')}
          </Link>
          <Link to="/create" className={pathname === '/create' ? 'active' : ''}>
            {t('navCreate')}
          </Link>
          <Link to="/dashboard" className={pathname.startsWith('/dashboard') ? 'active' : ''}>
            {t('navDashboard')}
          </Link>

          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleLanguage}
            style={{ marginLeft: 8, padding: '4px 12px', fontSize: '0.85rem' }}
          >
            {lang === 'ka' ? '🇬🇪 ქართული' : '🇺🇸 English'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateQuiz />} />
          <Route path="/quiz/:shareCode" element={<TakeQuiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:shareCode" element={<QuizDetail />} />
        </Routes>
      </div>
    </>
  );
}
