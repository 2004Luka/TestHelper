import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await api.post('/auth/register', {
        name: name.trim(),
        subject: subject.trim(),
        password,
      });

      // Navigate to login with success message
      navigate('/login', { state: { message: t('regSuccessMsg') } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>
          {t('registerTitle')}
        </h2>
        <p className="auth-subtitle">
          {t('registerSubtitle')}
        </p>

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
              {t('teacherSubject')}
            </label>
            <input
              type="text"
              placeholder="e.g. History / ისტორია"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
            {submitting ? '...' : t('registerBtn')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
