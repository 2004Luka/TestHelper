import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ImageQuizViewer({
  quiz,
  showBackButton,
  onBack,
  answers,
  onAnswer,
  onSubmit,
  submitting,
  timeLeft,
  formatTime,
}) {
  const { lang, t } = useLanguage();
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Pinch-to-zoom ref
  const touchStateRef = useRef({
    initialDist: null,
    initialScale: 1,
    lastTouch: null,
  });

  // Modal & Question state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Swipe detection for Question modal
  const swipeStartRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);

  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx] || null;
  const answeredCount = Object.keys(answers).length;

  const letters =
    lang === 'ka'
      ? ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ']
      : ['A', 'B', 'C', 'D', 'E', 'F'];

  // Silent orientation lock attempt on mobile
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch(() => {});
        }
      } catch {
        // Silently ignore unsupported browsers
      }
    };
    lockLandscape();
    return () => {
      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      } catch {}
    };
  }, []);

  // Mouse wheel zoom on canvas
  const handleWheel = (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.4), 6);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    const ratio = newScale / scale;

    setPos((prev) => ({
      x: mouseX - (mouseX - prev.x) * ratio,
      y: mouseY - (mouseY - prev.y) * ratio,
    }));
    setScale(newScale);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (isModalOpen || e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isModalOpen) return;
    setPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for image pan & pinch-zoom (only when modal is CLOSED)
  const handleTouchStart = (e) => {
    if (isModalOpen) return;
    const now = Date.now();
    if (e.touches.length === 1) {
      if (now - lastTapRef.current < 280) {
        // Double-tap to zoom or reset view
        if (scale > 1.2) {
          setScale(1);
          setPos({ x: 0, y: 0 });
        } else {
          setScale(2.2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pos.x,
        y: e.touches[0].clientY - pos.y,
      };
    } else if (e.touches.length === 2) {
      lastTapRef.current = 0;
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current = {
        initialDist: dist,
        initialScale: scale,
        lastTouch: null,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (isModalOpen) return;
    if (e.touches.length === 1 && isDragging) {
      setPos({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStateRef.current.initialDist) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStateRef.current.initialDist;
      const newScale = Math.min(
        Math.max(touchStateRef.current.initialScale * ratio, 0.4),
        6
      );
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStateRef.current.initialDist = null;
  };

  // Touch Swipe on Questions Modal
  const handleModalTouchStart = (e) => {
    if (e.touches.length === 1) {
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleModalTouchEnd = (e) => {
    if (e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - swipeStartRef.current.x;
      const diffY = e.changedTouches[0].clientY - swipeStartRef.current.y;
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0 && currentIdx < questions.length - 1) {
          // Swipe Left -> Next Question
          setCurrentIdx((i) => i + 1);
        } else if (diffX > 0 && currentIdx > 0) {
          // Swipe Right -> Prev Question
          setCurrentIdx((i) => i - 1);
        }
      }
    }
  };

  const apiBase = (
    import.meta.env.PROD
      ? '/api'
      : import.meta.env.VITE_API_URL || '/api'
  ).replace(/\/+$/, '');
  const apiOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  const apiFallbackUrl = `${apiBase}/quizzes/${quiz.shareCode}/image`;
  const imageUrl = quiz.backgroundImage
    ? quiz.backgroundImage.startsWith('data:') || quiz.backgroundImage.startsWith('http')
      ? quiz.backgroundImage
      : quiz.backgroundImage.startsWith('/api/')
      ? `${apiOrigin}${quiz.backgroundImage}`
      : apiFallbackUrl
    : apiFallbackUrl;
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const isApiImage =
    imgSrc === apiFallbackUrl || imgSrc.startsWith(`${apiOrigin}/api/`);
  const handleImgError = () => {
    if (!isApiImage && imgSrc !== apiFallbackUrl) setImgSrc(apiFallbackUrl);
  };

  return (
    <div
      className="image-quiz-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#0c0d10',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top HUD Bar */}
      <header className="image-quiz-hud">
        <div className="image-quiz-hud-left">
          {showBackButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onBack}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              ← {t('back')}
            </button>
          )}
          <span className="image-quiz-hud-title" title={quiz.title}>
            {quiz.title}
          </span>
        </div>

        <div className="image-quiz-hud-right">
          <span className="image-quiz-hud-counter">
            {answeredCount}/{questions.length}
          </span>
          {timeLeft !== null && (
            <div
              className={`timer ${
                timeLeft <= 60 ? 'danger' : timeLeft <= 300 ? 'warning' : ''
              }`}
              style={{ padding: '3px 10px', fontSize: '0.82rem' }}
            >
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      {/* Interactive Image Viewport */}
      <div
        ref={containerRef}
        className="image-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isModalOpen ? 'default' : isDragging ? 'grabbing' : 'grab',
          pointerEvents: isModalOpen ? 'none' : 'auto', // Freeze image when modal is open
          touchAction: 'none',
        }}
      >
        <div
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          <img
            className="image-quiz-background"
            src={imgSrc}
            crossOrigin={isApiImage ? 'use-credentials' : undefined}
            alt="Quiz Background"
            draggable={false}
            onError={handleImgError}
            style={{
              objectFit: 'contain',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              borderRadius: 'var(--radius-sm)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Floating Side Left: Finish Test (Desktop only) */}
        {!isModalOpen && (
          <button
            type="button"
            className="btn btn-secondary image-quiz-side-btn image-quiz-side-left"
            onClick={onSubmit}
            disabled={submitting}
          >
            <span>{submitting ? t('btnProcessing') : t('submitQuiz')}</span>
          </button>
        )}

        {/* Floating Side Right: Questions Button (Desktop only) */}
        {!isModalOpen && (
          <button
            type="button"
            className="btn btn-primary image-quiz-side-btn image-quiz-side-right"
            onClick={() => setIsModalOpen(true)}
          >
            <span>{t('questionsBtn')}</span>
            <span
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
              }}
            >
              {currentIdx + 1}/{questions.length}
            </span>
          </button>
        )}

        {/* Ergonomic Mobile Bottom Action Dock (Mobile only <= 768px) */}
        {!isModalOpen && (
          <div className="image-quiz-mobile-dock">
            <button
              type="button"
              className="btn btn-primary image-quiz-mobile-questions-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <span>{t('questionsBtn')}</span>
              <span
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--accent)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {currentIdx + 1}/{questions.length}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary image-quiz-mobile-finish-btn"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? t('btnProcessing') : t('submitQuiz')}
            </button>
          </div>
        )}
      </div>

      {/* Centered Popup Modal for Questions (Freezes behind image when open) */}
      {isModalOpen && currentQ && (
        <div
          className="image-quiz-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 100,
            pointerEvents: 'auto',
          }}
        >
          <div
            className="card image-quiz-modal"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click inside modal
            onTouchStart={handleModalTouchStart}
            onTouchEnd={handleModalTouchEnd}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 24px var(--accent-subtle)',
              border: '1px solid var(--border-active)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {t('questionOf')} {currentIdx + 1} / {questions.length}
                </span>
                {currentQ.type && (
                  <span
                    className="question-type"
                    style={{ marginLeft: 10, fontSize: '0.72rem' }}
                  >
                    {currentQ.type}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                title={t('closeModal')}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  fontSize: '1.2rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Question text & Options */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: 18,
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                }}
              >
                {currentQ.questionText}
              </div>

              {currentQ.type === 'fillin' ? (
                <input
                  className="form-input"
                  placeholder="..."
                  value={answers[currentIdx] || ''}
                  onChange={(e) => onAnswer(currentIdx, e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="option-list">
                  {(Array.isArray(currentQ.options) ? currentQ.options : []).map(
                    (opt, j) => {
                      const isSelected = answers[currentIdx] === opt;
                      return (
                        <div
                          key={j}
                          className={`option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => onAnswer(currentIdx, opt)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="option-letter">
                            {letters[j] || j + 1}
                          </span>
                          <span className="option-text">{opt}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Modal Navigation Footer */}
            <div className="image-quiz-modal-footer">
              {/* Question dots carousel */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  padding: '2px 0 6px',
                  justifyContent: questions.length <= 12 ? 'center' : 'flex-start',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {questions.map((_, idx) => {
                  const isAnswered = answers[idx] !== undefined && answers[idx] !== '';
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: isCurrent
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-color)',
                        background: isCurrent
                          ? 'var(--accent)'
                          : isAnswered
                          ? 'var(--status-on-bg)'
                          : 'transparent',
                        color: isCurrent
                          ? 'var(--accent-contrast)'
                          : isAnswered
                          ? 'var(--status-on)'
                          : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Navigation row: Prev | Peek Image | Next */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
                  disabled={currentIdx === 0}
                  style={{ minWidth: 80, padding: '7px 12px' }}
                >
                  ← {t('prevQuestion')}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px 10px' }}
                  title={t('closeModal')}
                >
                  {t('closeModal')}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))
                  }
                  disabled={currentIdx === questions.length - 1}
                  style={{ minWidth: 80, padding: '7px 12px' }}
                >
                  {t('nextQuestion')} →
                </button>
              </div>

              {/* Footer hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingTop: 4,
                  borderTop: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{t('swipeOrArrowHint')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

