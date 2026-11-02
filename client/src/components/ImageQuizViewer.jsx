import { useState, useRef, useEffect, useCallback } from 'react';
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

  // Center image on mount or when container loads
  const handleReset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  // Zoom helpers
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s * 0.8, 0.4));

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
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pos.x,
        y: e.touches[0].clientY - pos.y,
      };
    } else if (e.touches.length === 2) {
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
      e.preventDefault();
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

  const apiBase = import.meta.env.PROD
    ? ''
    : import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : '';
  const apiFallbackUrl = `${apiBase}/api/quizzes/${quiz.shareCode}/image`;
  const imageUrl = quiz.backgroundImage
    ? quiz.backgroundImage.startsWith('data:') || quiz.backgroundImage.startsWith('http')
      ? quiz.backgroundImage
      : quiz.backgroundImage.startsWith('/api/')
      ? `${apiBase}${quiz.backgroundImage}`
      : apiFallbackUrl
    : apiFallbackUrl;
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const isApiImage = imgSrc === apiFallbackUrl || imgSrc.startsWith('/api/');
  const handleImgError = () => {
    if (imgSrc !== apiFallbackUrl) setImgSrc(apiFallbackUrl);
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
      <header
        className="image-quiz-hud"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(16, 16, 18, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 60,
          userSelect: 'none',
        }}
      >
        <div className="image-quiz-hud-main" style={{ display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
              {t('back')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSubmit}
            disabled={submitting}
            style={{ fontWeight: 700 }}
          >
            {submitting ? t('btnProcessing') : t('submitQuiz')}
          </button>
          <span
            className="image-quiz-hud-title"
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {quiz.title}
          </span>
          <span
            className="image-quiz-hud-count"
            style={{
              borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
            }}
          >
            {answeredCount}/{questions.length} {t('questionsText')}
          </span>
        </div>

        <div className="image-quiz-hud-timer" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {timeLeft !== null && (
            <div
              className={`timer ${
                timeLeft <= 60 ? 'danger' : timeLeft <= 300 ? 'warning' : ''
              }`}
              style={{ padding: '4px 12px', fontSize: '0.9rem' }}
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

        {/* Floating Zoom Controls (Bottom Left) */}
        {!isModalOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(20px + env(safe-area-inset-bottom))',
              left: 20,
              display: 'flex',
              gap: 8,
              background: 'rgba(26, 26, 29, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              zIndex: 65,
              pointerEvents: 'auto',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleZoomIn}
              title={t('zoomIn')}
              style={{ width: 34, height: 34, padding: 0, fontWeight: 700, fontSize: '1.2rem' }}
            >
              +
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleZoomOut}
              title={t('zoomOut')}
              style={{ width: 34, height: 34, padding: 0, fontWeight: 700, fontSize: '1.2rem' }}
            >
              −
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              title={t('resetZoom')}
              style={{ padding: '0 10px', fontSize: '0.8rem' }}
            >
              {t('resetZoom')}
            </button>
          </div>
        )}

        {/* Floating Finish Test Button on Left Side */}
        {!isModalOpen && (
          <button
            type="button"
            className="btn btn-secondary image-quiz-finish-button"
            onClick={onSubmit}
            disabled={submitting}
            style={{
              zIndex: 70,
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 255, 255, 0.08)',
              fontWeight: 700,
              alignItems: 'center',
              gap: 8,
              borderRadius: 'var(--radius-pill)',
              pointerEvents: 'auto',
            }}
          >
            <span>{submitting ? t('btnProcessing') : t('submitQuiz')}</span>
          </button>
        )}

        {/* Floating Button on Right Side */}
        {!isModalOpen && (
          <button
            type="button"
            className="btn btn-primary image-quiz-questions-button"
            onClick={() => setIsModalOpen(true)}
            style={{
              zIndex: 70,
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 16px var(--accent-glow)',
              fontWeight: 700,
              alignItems: 'center',
              gap: 10,
              borderRadius: 'var(--radius-pill)',
              pointerEvents: 'auto',
            }}
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
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={onSubmit}
                    disabled={submitting}
                    style={{ fontWeight: 700 }}
                  >
                    {submitting ? t('btnProcessing') : t('submitQuiz')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
                    disabled={currentIdx === 0}
                    style={{ minWidth: 80 }}
                  >
                    ← {t('prevQuestion')}
                  </button>
                </div>

                {/* Quick question indicator pills */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    maxWidth: 240,
                    padding: '2px 0',
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
                          width: 26,
                          height: 26,
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

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))
                  }
                  disabled={currentIdx === questions.length - 1}
                  style={{ minWidth: 90 }}
                >
                  {t('nextQuestion')} →
                </button>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                {t('swipeOrArrowHint')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

