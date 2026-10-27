import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Register() {
  const { t } = useLanguage();
  const { studentLogin, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 'student' or 'teacher'
  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const [role, setRole] = useState(initialRole);

  // Teacher fields
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // Student fields
  const [studentFullName, setStudentFullName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classCodeInput, setClassCodeInput] = useState('');

  // Dropdown data
  const [teachersList, setTeachersList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [directTeacher, setDirectTeacher] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const teacherQueryParam = searchParams.get('teacher');

  // If registering via direct teacher link, fetch teacher info directly
  useEffect(() => {
    if (role === 'student' && teacherQueryParam) {
      const fetchDirectTeacher = async () => {
        try {
          const res = await api.get(`/students/teachers/${teacherQueryParam}`);
          if (res?.data) {
            setDirectTeacher(res.data);
            setSelectedTeacherId(res.data._id);
          }
        } catch {
          // If not found, user can still select from dropdown
        }
      };
      fetchDirectTeacher();
    }
  }, [role, teacherQueryParam]);

  // Fetch teachers list when in student mode
  useEffect(() => {
    if (role === 'student') {
      const fetchTeachers = async () => {
        setLoadingTeachers(true);
        try {
          const res = await api.get('/students/teachers');
          setTeachersList(res.data || []);
        } catch {
          // ignore
        }
        setLoadingTeachers(false);
      };
      fetchTeachers();
    }
  }, [role]);

  // Fetch classes for selected teacher
  useEffect(() => {
    if (selectedTeacherId) {
      const fetchClasses = async () => {
        try {
          const res = await api.get(`/students/teachers/${selectedTeacherId}/classes`);
          setClassesList(res.data || []);
        } catch {
          setClassesList([]);
        }
      };
      fetchClasses();
    } else {
      setClassesList([]);
      setSelectedClassId('');
    }
  }, [selectedTeacherId]);

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherSubject.trim() || !teacherPassword) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const res = await api.post('/auth/register', {
        name: teacherName.trim(),
        subject: teacherSubject.trim(),
        password: teacherPassword,
      });

      if (res.token && res.teacher) {
        login(res.token, res.teacher);
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { message: t('regSuccessMsg') } });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentFullName.trim() || !studentUsername.trim() || !studentPassword || !selectedTeacherId) {
      setError('Please provide full name, username, password, and select a teacher.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const res = await api.post('/students/register', {
        name: studentFullName.trim(),
        username: studentUsername.trim(),
        password: studentPassword,
        teacherId: selectedTeacherId,
        classId: selectedClassId || undefined,
        classCode: classCodeInput.trim() || undefined,
      });

      studentLogin(res.token, res.student);
      navigate('/student/portal');
    } catch (err) {
      setError(err.message || 'Student registration failed. Please try again.');
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
          {role === 'student' ? t('studentRegisterTitle') : t('registerTitle')}
        </h2>
        <p className="auth-subtitle">
          {role === 'student' ? t('studentRegisterSubtitle') : t('registerSubtitle')}
        </p>

        {error && (
          <div className="inline-alert inline-alert-error">
            {error}
          </div>
        )}

        {role === 'student' ? (
          /* Student Registration Form */
          <form onSubmit={handleStudentSubmit}>
            <div className="form-group-inline">
              <label>{t('studentFullName')}</label>
              <input
                type="text"
                placeholder="e.g. Giorgi Beridze / გიორგი ბერიძე"
                value={studentFullName}
                onChange={(e) => setStudentFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inline">
              <label>{t('username')}</label>
              <input
                type="text"
                placeholder="e.g. giorgi10"
                value={studentUsername}
                onChange={(e) => setStudentUsername(e.target.value)}
                required
                autoCapitalize="none"
              />
            </div>

            <div className="form-group-inline">
              <label>{t('password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
              />
            </div>

            {directTeacher ? (
              <div className="form-group-inline">
                <label>{t('teacherProfile')}</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                      {t('teacherDirectNotice')}
                    </span>
                    <strong style={{ color: 'var(--accent)', fontSize: '0.96rem' }}>
                      {directTeacher.name}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 6 }}>
                      ({directTeacher.subject})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => {
                      setDirectTeacher(null);
                      setSelectedTeacherId('');
                    }}
                  >
                    {t('changeTeacher')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-group-inline">
                <label>{t('selectTeacher')}</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  disabled={loadingTeachers}
                >
                  <option value="">{t('chooseTeacherPrompt')}</option>
                  {teachersList.map((tc) => (
                    <option key={tc._id} value={tc._id}>
                      {tc.name} ({tc.subject})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTeacherId && classesList.length > 0 && (
              <div className="form-group-inline">
                <label>{t('selectClass')}</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    if (e.target.value) setClassCodeInput('');
                  }}
                >
                  <option value="">{t('chooseClassPrompt')}</option>
                  {classesList.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group-inline">
              <label>{t('classCode')}</label>
              <input
                type="text"
                placeholder={t('classCodePlaceholder')}
                value={classCodeInput}
                onChange={(e) => {
                  setClassCodeInput(e.target.value);
                  if (e.target.value) setSelectedClassId('');
                }}
                style={{ textTransform: 'uppercase' }}
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
        ) : (
          /* Teacher Registration Form */
          <form onSubmit={handleTeacherSubmit}>
            <div className="form-group-inline">
              <label>{t('teacherName')}</label>
              <input
                type="text"
                placeholder="e.g. Giorgi Beridze"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inline">
              <label>{t('teacherSubject')}</label>
              <input
                type="text"
                placeholder="e.g. History / ისტორია"
                value={teacherSubject}
                onChange={(e) => setTeacherSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inline">
              <label>{t('password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
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
        )}

        <div className="auth-footer">
          <Link to={`/login?role=${role}`}>
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
