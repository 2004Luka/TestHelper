import { useState } from 'react';
import api from '../api/client';
import FileUpload from '../components/FileUpload';
import QuizPreview from '../components/QuizPreview';
import QuizSettings from '../components/QuizSettings';

export default function CreateQuiz() {
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
      setError('Please upload both the test file and answer key file.');
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
      // Fallback for older browsers
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

  // Already created — show success + preview
  if (quiz) {
    return (
      <div className="page">
        <h1 className="page-title">✅ Quiz Created!</h1>
        <p className="page-subtitle">
          Share this link with your students. They can start taking the test immediately.
        </p>

        <div className="card">
          <div className="card-title">{quiz.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            {quiz.questions.length} questions · Share code: {quiz.shareCode}
          </div>

          <div className="share-link-box">
            <input value={shareUrl} readOnly />
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          {copied && <span className="copy-feedback">Link copied to clipboard!</span>}

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
              ➕ Create Another
            </button>
            <a href={`/dashboard/${quiz.shareCode}`} className="btn btn-secondary">
              📊 View Dashboard
            </a>
          </div>
        </div>

        <QuizPreview questions={quiz.questions} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Create Quiz</h1>
      <p className="page-subtitle">
        Upload your Word document test file and its answer key to generate a shareable quiz link.
      </p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="form-group">
        <label className="form-label">Quiz Title</label>
        <input
          className="form-input"
          placeholder="e.g. Biology Chapter 5 Test"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div>
          <div className="form-label">📄 Test File (Questions)</div>
          <FileUpload
            label="your test document"
            file={testFile}
            onFile={setTestFile}
          />
        </div>
        <div>
          <div className="form-label">📝 Answer Key File</div>
          <FileUpload
            label="the answer key"
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
              Processing...
            </>
          ) : (
            '🚀 Generate Quiz Link'
          )}
        </button>
      </div>
    </div>
  );
}
