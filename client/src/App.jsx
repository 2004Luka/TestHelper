import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Dashboard from './pages/Dashboard';
import QuizDetail from './pages/QuizDetail';
import Register from './pages/Register';
import Login from './pages/Login';
import TeacherStudents from './pages/TeacherStudents';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Logo from './components/Logo';
import TeacherSettings from './pages/TeacherSettings';

import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

/* ── Inline SVG Icon Components (no emojis) ── */
function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  );
}

function IconCreate() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconStudents() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconRegister() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconPortal() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconLang() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

/* ── NavItem helper ── */
function NavItem({ to, icon, label, isActive, onClick }) {
  if (onClick) {
    return (
      <button
        className={`sidenav-item${isActive ? ' active' : ''}`}
        onClick={onClick}
        data-tooltip={label}
        aria-label={label}
      >
        <span className="sidenav-icon">{icon}</span>
        <span className="sidenav-label">{label}</span>
      </button>
    );
  }
  return (
    <Link
      to={to}
      className={`sidenav-item${isActive ? ' active' : ''}`}
      data-tooltip={label}
      aria-label={label}
    >
      <span className="sidenav-icon">{icon}</span>
      <span className="sidenav-label">{label}</span>
    </Link>
  );
}

function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLanguage, t } = useLanguage();
  const { teacher, logout, student, studentLogout } = useAuth();
  const navigate = useNavigate();

  const handleStudentLogout = () => {
    studentLogout();
    navigate('/');
  };

  // Show minimal header on student quiz page
  const isStudentQuiz = pathname.startsWith('/quiz/');

  if (isStudentQuiz) {
    return (
      <div className="student-header">
        <Link to="/" className="navbar-brand">
          <Logo size="sm" />
        </Link>
        <button
          className="btn btn-secondary btn-sm lang-btn"
          onClick={toggleLanguage}
          title="Switch Language"
        >
          {lang === 'ka' ? 'KA' : 'EN'}
        </button>
      </div>
    );
  }

  // Build nav items based on auth state
  const navItems = [
    { to: '/', icon: <IconHome />, label: t('navHome'), active: pathname === '/' },
  ];

  if (teacher) {
    navItems.push(
      { to: '/create', icon: <IconCreate />, label: t('navCreate'), active: pathname === '/create' },
      { to: '/dashboard', icon: <IconDashboard />, label: t('navDashboard'), active: pathname.startsWith('/dashboard') },
      { to: '/students', icon: <IconStudents />, label: t('navStudents'), active: pathname === '/students' },
      { to: '/settings', icon: <IconSettings />, label: t('profileAndSettings'), active: pathname === '/settings' },
    );
  } else if (student) {
    navItems.push(
      { to: '/student/portal', icon: <IconPortal />, label: t('navStudentPortal'), active: pathname === '/student/portal' },
    );
  } else {
    navItems.push(
      { to: '/login', icon: <IconLogin />, label: t('navLogin'), active: pathname === '/login' },
      { to: '/register', icon: <IconRegister />, label: t('navRegister'), active: pathname === '/register' },
    );
  }

  return (
    <>
      {/* ── Desktop Vertical Sidebar ── */}
      <aside className="sidenav" aria-label="Main navigation">
        <div className="sidenav-top">
          <Link to="/" className="sidenav-brand" aria-label="Home">
            <Logo size="sm" showText={false} />
          </Link>
        </div>

        <nav className="sidenav-nav">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
            />
          ))}
        </nav>

        <div className="sidenav-bottom">
          <NavItem
            icon={<IconLang />}
            label={lang === 'ka' ? 'English' : 'ქართული'}
            onClick={toggleLanguage}
          />
          {(teacher || student) && (
            <NavItem
              icon={<IconLogout />}
              label={t('logout')}
              onClick={teacher ? logout : handleStudentLogout}
            />
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="bottomnav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`bottomnav-item${item.active ? ' active' : ''}`}
            aria-label={item.label}
          >
            <span className="bottomnav-icon">{item.icon}</span>
          </Link>
        ))}
        <button
          className={`bottomnav-item`}
          onClick={toggleLanguage}
          aria-label="Language"
        >
          <span className="bottomnav-icon">
            <span className="bottomnav-lang-text">{lang === 'ka' ? 'EN' : 'KA'}</span>
          </span>
        </button>
        {(teacher || student) && (
          <button
            className="bottomnav-item"
            onClick={teacher ? logout : handleStudentLogout}
            aria-label={t('logout')}
          >
            <span className="bottomnav-icon"><IconLogout /></span>
          </button>
        )}
      </nav>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isStudentQuiz = pathname.startsWith('/quiz/');

  return (
    <div className={`app-shell${isStudentQuiz ? ' quiz-mode' : ''}`}>
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

          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <TeacherStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <TeacherSettings />
              </ProtectedRoute>
            }
          />

          {/* Student Portal Route */}
          <Route path="/student/portal" element={<StudentDashboard />} />

          {/* Public Student Route */}
          <Route path="/quiz/:shareCode" element={<TakeQuiz />} />
        </Routes>
      </div>
    </div>
  );
}
