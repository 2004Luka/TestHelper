import { useEffect, useState } from 'react';
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
  const [resetToken, setResetToken] = useState(() => (
    new URLSearchParams(window.location.hash.slice(1)).get('student-reset') || ''
  ));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const successMessage = location.state?.message || '';

  useEffect(() => {
    if (resetToken && window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, [resetToken]);

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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await api.post('/students/password-reset', { token: resetToken, password: newPassword });
      setResetToken('');
      navigate('/login?role=student', {
        replace: true,
        state: { message: t('studentPasswordResetSuccess') },
      });
    } catch (err) {
      setError(err.message || 'Password reset failed. Please request a new link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (resetToken) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h2>{t('studentPasswordResetTitle')}</h2>
          <p className="auth-subtitle">{t('studentPasswordResetSubtitle')}</p>

          {error && <div className="inline-alert inline-alert-error">{error}</div>}

          <form onSubmit={handlePasswordReset}>
            <div className="form-group-inline">
              <label>{t('newPasswordLabel')}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group-inline">
              <label>{t('confirmPasswordLabel')}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? t('btnProcessing') : t('saveChangesBtn')}
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setResetToken('');
                navigate('/login?role=student', { replace: true });
              }}
            >
              {t('studentLoginTitle')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
