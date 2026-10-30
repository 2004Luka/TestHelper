import { useState } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';

export default function Login() {
  const { t } = useLanguage();
  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const [role, setRole] = useState(initialRole);

  const [identifier, setIdentifier] = useState(''); // Teacher Name or Student Username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);

      if (role === 'student') {
        const res = await api.post('/students/login', {
          username: identifier.trim(),
          password,
        });

        studentLogin(res.student);
        navigate('/student/portal');
      } else {
        const res = await api.post('/auth/login', {
          name: identifier.trim(),
          password,
        });

        login(res.teacher);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Logo size="lg" />
        </div>

        {/* Role Switcher Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => {
              setRole('student');
              setError('');
            }}
          >
            {t('roleStudent')}
          </button>
          <button
            type="button"
            className={`auth-role-tab ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => {
              setRole('teacher');
              setError('');
            }}
          >
            {t('roleTeacher')}
          </button>
        </div>

        <h2>
          {role === 'student' ? t('studentLoginTitle') : t('loginTitle')}
        </h2>
        <p className="auth-subtitle">
          {role === 'student' ? t('studentLoginSubtitle') : t('loginSubtitle')}
        </p>

        {successMessage && (
          <div className="inline-alert inline-alert-success">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="inline-alert inline-alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-inline">
            <label>
              {role === 'student' ? t('username') : t('teacherName')}
            </label>
            <input
              type="text"
              placeholder={role === 'student' ? 'e.g. giorgi10' : 'e.g. Giorgi Beridze'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoCapitalize="none"
            />
          </div>

          <div className="form-group-inline">
            <label>
              {t('password')}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? '...' : t('loginBtn')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to={`/register?role=${role}`}>
            {t('dontHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
