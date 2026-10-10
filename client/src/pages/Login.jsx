import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const res = await api.post('/auth/login', {
        name: name.trim(),
        password,
      });

      login(res.token, res.teacher);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Invalid name or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>
          {t('loginTitle')}
        </h2>
        <p className="auth-subtitle">
          {t('loginSubtitle')}
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
              {t('teacherName')}
            </label>
            <input
              type="text"
              placeholder="e.g. Giorgi Beridze"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
          <Link to="/register">
            {t('dontHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
