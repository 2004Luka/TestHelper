import { useLanguage } from '../context/LanguageContext';

export default function QuizSettings({ settings, onChange }) {
  const { t } = useLanguage();

  const update = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>⚙️ {t('quizTitleLabel')} {t('navHome') === 'Home' ? 'Settings' : 'პარამეტრები'}</div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('timeLimit')}</label>
          <input
            type="number"
            className="form-input"
            min="0"
            placeholder={t('noTimeLimit')}
            value={settings.timeLimit || ''}
            onChange={(e) => update('timeLimit', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <label className="form-check">
            <input
              type="checkbox"
              checked={settings.shuffleQuestions || false}
              onChange={(e) => update('shuffleQuestions', e.target.checked)}
            />
            <span>{t('shuffleQuestions')}</span>
          </label>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <label className="form-check">
            <input
              type="checkbox"
              checked={settings.showScoreImmediately ?? true}
              onChange={(e) => update('showScoreImmediately', e.target.checked)}
            />
            <span>{t('showScoreImmediately')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
