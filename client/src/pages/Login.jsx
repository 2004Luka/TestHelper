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
    <div style={{ maxWidth: 440, margin: '40px auto' }}>
      <div className="card shadow-lg" style={{ padding: '32px 28px', borderRadius: 16 }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          {t('loginTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, fontSize: '0.95rem' }}>
          {t('loginSubtitle')}
        </p>

        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--success, #10b981)',
              color: 'var(--success, #10b981)',
              fontSize: '0.9rem',
            }}
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger, #ef4444)',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>
              {t('teacherName')}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Giorgi Beridze"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>
              {t('password')}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8 }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600, borderRadius: 8 }}
          >
            {submitting ? '...' : t('loginBtn')}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
            {t('dontHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
