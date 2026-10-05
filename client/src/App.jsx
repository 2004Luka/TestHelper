import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Dashboard from './pages/Dashboard';
import QuizDetail from './pages/QuizDetail';

function Navbar() {
  const { pathname } = useLocation();

  // Hide navbar on student quiz page for cleaner experience
  if (pathname.startsWith('/quiz/')) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">Q</span>
          QuizGen
        </Link>
        <div className="navbar-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/create" className={pathname === '/create' ? 'active' : ''}>
            Create
          </Link>
          <Link to="/dashboard" className={pathname.startsWith('/dashboard') ? 'active' : ''}>
            Dashboard
          </Link>
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
