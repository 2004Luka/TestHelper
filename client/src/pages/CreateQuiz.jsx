import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import FileUpload from '../components/FileUpload';
import QuizPreview from '../components/QuizPreview';
import QuizSettings from '../components/QuizSettings';
import { useLanguage } from '../context/LanguageContext';
import { compressImage } from '../utils/imageCompressor';

export default function CreateQuiz() {
  const { t } = useLanguage();
  const [quizMode, setQuizMode] = useState('standard');
  const [imageFile, setImageFile] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [testFile, setTestFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState({
    timeLimit: 0,
    showScoreImmediately: true,
  });
  const [quiz, setQuiz] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [editError, setEditError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const imageSelectionRef = useRef(0);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleImageSelect = async (file) => {
    const selectionId = ++imageSelectionRef.current;
    if (!file) {
      setImageFile(null);
      setCompressedImage(null);
      setCompressing(false);
      setError('');
      return;
    }
    setImageFile(file);
    setCompressedImage(null);
    setError('');
    try {
      setCompressing(true);
      const res = await compressImage(file);
      if (selectionId !== imageSelectionRef.current) return;
      setCompressedImage(res);
    } catch (err) {
      if (selectionId !== imageSelectionRef.current) return;
      console.error('Image compression failed:', err);
      setError(err.message);
    } finally {
      if (selectionId === imageSelectionRef.current) setCompressing(false);
    }
  };

  const handleCreate = async () => {
    if (quizMode === 'image' && !imageFile) {
      setError(t('imageFileLabel') + ' is required');
      return;
    }
    if (!testFile || !answerFile) {
      setError(t('createSubtitle'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('quizType', quizMode);
      if (quizMode === 'image') {
        let comp = compressedImage;
        if (!comp && imageFile) {
          comp = await compressImage(imageFile);
          setCompressedImage(comp);
        }
        if (comp?.blob) {
          const ext = comp.format === 'image/jpeg' ? '.jpg' : '.webp';
          const filename = (imageFile.name || 'image').replace(/\.[^.]+$/, ext);
          formData.append('imageFile', comp.blob, filename);
        } else if (imageFile) {
          formData.append('imageFile', imageFile);
        }
      }
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

  const startEditingQuestions = () => {
    setEditedTitle(quiz.title);
    setEditedQuestions(quiz.questions.map((question) => ({
      ...question,
      options: [...(question.options || [])],
    })));
    setEditingQuestions(true);
    setEditError('');
  };

  const handleQuestionChange = (index, question) => {
    setEditedQuestions((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? question : item
    )));
  };

  const handleSaveQuestions = async () => {
    setSavingQuestions(true);
    setEditError('');
    try {
      const res = await api.patch(`/quizzes/${quiz.shareCode}`, {
        title: editedTitle,
        questions: editedQuestions,
      });
      setQuiz(res.data);
      setEditedTitle(res.data.title);
      setEditingQuestions(false);
      setEditedQuestions([]);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingQuestions(false);
    }
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
          {editingQuestions ? (
            <input
              className="form-input"
              aria-label={t('quizTitleLabel')}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
          ) : (
            <div className="card-title">{quiz.title}</div>
          )}
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
                setImageFile(null);
                setCompressedImage(null);
                setTestFile(null);
                setAnswerFile(null);
                setEditingQuestions(false);
                setEditedTitle('');
                setEditedQuestions([]);
                setEditError('');
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

        <div className="btn-group" style={{ marginTop: 24 }}>
          {editingQuestions ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveQuestions}
                disabled={savingQuestions}
              >
                {savingQuestions ? t('btnProcessing') : t('saveChangesBtn')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingQuestions(false);
                  setEditedTitle('');
                  setEditedQuestions([]);
                  setEditError('');
                }}
                disabled={savingQuestions}
              >
                {t('cancelEditBtn')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={startEditingQuestions}>
              {t('editQuizBtn')}
            </button>
          )}
        </div>
        {editError && <div className="alert alert-error" role="alert">{editError}</div>}
        <QuizPreview
          questions={editingQuestions ? editedQuestions : quiz.questions}
          editable={editingQuestions}
          onQuestionChange={handleQuestionChange}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">{t('createTitle')}</h1>
      <p className="page-subtitle">
        {quizMode === 'image' ? t('createImageSubtitle') : t('createSubtitle')}
      </p>

      {/* Mode Switcher Tabs */}
      <div className="create-quiz-tab-switcher">
        <button
          type="button"
          className={`btn ${quizMode === 'standard' ? 'btn-primary' : 'btn-ghost'} create-quiz-tab-btn`}
          onClick={() => {
            setQuizMode('standard');
            setError('');
          }}
        >
          {t('tabStandardQuiz')}
        </button>
        <button
          type="button"
          className={`btn ${quizMode === 'image' ? 'btn-primary' : 'btn-ghost'} create-quiz-tab-btn`}
          onClick={() => {
            setQuizMode('image');
            setError('');
          }}
        >
          {t('tabImageQuiz')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">{t('quizTitleLabel')}</label>
        <input
          className="form-input"
          placeholder={t('quizTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Image Upload Zone (Only in Image Quiz Mode) */}
      {quizMode === 'image' && (
        <div className="image-quiz-setup-card">
          <div className="image-quiz-setup-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {t('imageFileLabel')}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {t('imageFileSubLabel')} — PNG, JPG, WebP, GIF, BMP, HEIC
              </p>
            </div>
            <span className="badge badge-accent">{t('imageQuizBadge')}</span>
          </div>

          <FileUpload
            accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif,.heic,.heif"
            label={t('imageFileSubLabel')}
            file={imageFile}
            onFile={handleImageSelect}
          />

          {compressing && (
            <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span>Optimizing image for database and student devices...</span>
            </div>
          )}

          {imageFile && (
            <div className="image-quiz-preview-container">
              <div className="image-quiz-preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageFile.name}
                  </span>
                  {compressedImage && (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      {Math.round(compressedImage.compressedSize / 1024)} KB
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {compressedImage?.compressionRatio > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      reduced {compressedImage.compressionRatio}%
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleImageSelect(null)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="image-quiz-preview-viewport">
                <img
                  src={compressedImage?.dataUrl || imagePreviewUrl}
                  alt="Background Preview"
                />
              </div>
            </div>
          )}
        </div>
      )}

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
          disabled={
            loading ||
            compressing ||
            !testFile ||
            !answerFile ||
            (quizMode === 'image' && (!imageFile || !compressedImage))
          }
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
