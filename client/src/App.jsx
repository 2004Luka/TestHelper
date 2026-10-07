import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Dashboard from './pages/Dashboard';
import QuizDetail from './pages/QuizDetail';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLanguage, t } = useLanguage();
  const { teacher, logout } = useAuth();

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

          {teacher ? (
            <>
              <Link to="/create" className={pathname === '/create' ? 'active' : ''}>
                {t('navCreate')}
              </Link>
              <Link to="/dashboard" className={pathname.startsWith('/dashboard') ? 'active' : ''}>
                {t('navDashboard')}
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginLeft: 8,
                  padding: '4px 10px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                <span>👨‍🏫 {teacher.name}</span>
                <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>({teacher.subject})</span>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                style={{ marginLeft: 4, padding: '4px 10px', fontSize: '0.85rem' }}
              >
                🚪 {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={pathname === '/login' ? 'active' : ''}>
                🔑 {t('navLogin')}
              </Link>
              <Link to="/register" className={pathname === '/register' ? 'active' : ''}>
                ✨ {t('navRegister')}
              </Link>
            </>
          )}

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
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Teacher Routes */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:shareCode"
            element={
              <ProtectedRoute>
                <QuizDetail />
              </ProtectedRoute>
            }
          />

          {/* Public Student Route */}
          <Route path="/quiz/:shareCode" element={<TakeQuiz />} />
        </Routes>
      </div>
    </>
  );
}
