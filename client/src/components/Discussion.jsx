import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function Discussion({ shareCode, currentUser, currentRole }) {
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const loadComments = async () => {
    try {
      const res = await api.get(`/comments/${shareCode}`);
      setComments(res.data);
    } catch {
      // silent fail on load
    }
  };

  useEffect(() => {
    loadComments();
    const interval = setInterval(loadComments, 10000);
    return () => clearInterval(interval);
  }, [shareCode]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await api.post('/comments', {
        shareCode,
        author: currentUser,
        role: currentRole,
        message: message.trim(),
      });
      setMessage('');
      await loadComments();
    } catch {
      // error handled silently
    }
    setLoading(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="discussion-container">
      <div className="section-title">{t('discussionTitle')}</div>

      <div className="comment-list" ref={listRef}>
        {comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💬</div>
            <div>{t('noComments')}</div>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <div className={`comment-avatar ${c.role}`}>
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{c.author}</span>
                  <span className={`comment-role ${c.role}`}>{c.role}</span>
                  <span className="comment-time">{formatTime(c.createdAt)}</span>
                </div>
                <div className="comment-text">{c.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={handleSend}>
        <input
          className="form-input"
          placeholder={t('addCommentPlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !message.trim()}>
          {t('postCommentBtn')}
        </button>
      </form>
    </div>
  );
}
