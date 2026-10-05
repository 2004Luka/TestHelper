import { useState } from 'react';
import api from '../api/client';
import FileUpload from '../components/FileUpload';
import QuizPreview from '../components/QuizPreview';
import QuizSettings from '../components/QuizSettings';
import { useLanguage } from '../context/LanguageContext';

export default function CreateQuiz() {
  const { t } = useLanguage();
  const [testFile, setTestFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState({
    timeLimit: 0,
    shuffleQuestions: false,
    showScoreImmediately: true,
  });
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!testFile || !answerFile) {
      setError(t('createSubtitle'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('testFile', testFile);
      formData.append('answerFile', answerFile);
      formData.append('title', title || 'Untitled Quiz');
      formData.append('settings', JSON.stringify(settings));

      const res = await api.postForm('/quizzes', formData);
      setQuiz(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const shareUrl = quiz
    ? `${window.location.origin}/quiz/${quiz.shareCode}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (quiz) {
    return (
      <div className="page">
        <h1 className="page-title">{t('createdHeader')}</h1>
        <p className="page-subtitle">{t('createdSub')}</p>

        <div className="card">
          <div className="card-title">{quiz.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            {quiz.questions.length} {t('questionsText')} · {t('shareCode')}: {quiz.shareCode}
          </div>

          <div className="share-link-box">
            <input value={shareUrl} readOnly />
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>
              {copied ? t('btnCopied') : t('btnCopy')}
            </button>
          </div>

          {copied && <span className="copy-feedback">{t('btnCopied')}</span>}

          <div className="btn-group" style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setQuiz(null);
                setTestFile(null);
                setAnswerFile(null);
                setTitle('');
                setError('');
              }}
            >
              {t('btnCreateAnother')}
            </button>
            <a href={`/dashboard/${quiz.shareCode}`} className="btn btn-secondary">
              {t('btnViewDashboard')}
            </a>
          </div>
        </div>

        <QuizPreview questions={quiz.questions} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">{t('createTitle')}</h1>
      <p className="page-subtitle">{t('createSubtitle')}</p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="form-group">
        <label className="form-label">{t('quizTitleLabel')}</label>
        <input
          className="form-input"
          placeholder={t('quizTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div>
          <div className="form-label">{t('testFileLabel')}</div>
          <FileUpload
            label={t('testFileSubLabel')}
            file={testFile}
            onFile={setTestFile}
          />
        </div>
        <div>
          <div className="form-label">{t('answerFileLabel')}</div>
          <FileUpload
            label={t('answerFileSubLabel')}
            file={answerFile}
            onFile={setAnswerFile}
          />
        </div>
      </div>

      <QuizSettings settings={settings} onChange={setSettings} />

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCreate}
          disabled={loading || !testFile || !answerFile}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, marginBottom: 0 }} />
              {t('btnProcessing')}
            </>
          ) : (
            t('btnGenerate')
          )}
        </button>
      </div>
    </div>
  );
}
