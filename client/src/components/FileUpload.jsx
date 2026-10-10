import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function FileUpload({ label, accept = '.docx', file, onFile }) {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    if (e.target.files[0]) onFile(e.target.files[0]);
  };

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div className="upload-icon">{file ? '✓' : '↑'}</div>
      <div className="upload-text">
        {file ? (
          <div>
            <div className="upload-filename">{file.name}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('dropzoneChange')}
            </span>
          </div>
        ) : (
          <>
            <strong>{t('dropzoneText')}</strong>
            <br />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('supportedFormat')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
