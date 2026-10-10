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
      <div className="student-lang-toggle">
        <button
          className="btn btn-secondary btn-sm lang-btn"
          onClick={toggleLanguage}
          title="Switch Language / ენის შეცვლა"
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

              <div className="teacher-badge">
                <span>{teacher.name}</span>
                <span className="teacher-subject">({teacher.subject})</span>
              </div>

              <button
                className="btn btn-secondary btn-sm nav-action-btn"
                onClick={logout}
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={pathname === '/login' ? 'active' : ''}>
                {t('navLogin')}
              </Link>
              <Link to="/register" className={pathname === '/register' ? 'active' : ''}>
                {t('navRegister')}
              </Link>
            </>
          )}

          <button
            className="btn btn-secondary btn-sm lang-btn"
            onClick={toggleLanguage}
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
