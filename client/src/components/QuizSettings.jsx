/**
 * Quiz settings panel for teachers.
 * Props: settings, onChange
 */
export default function QuizSettings({ settings, onChange }) {
  const update = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>⚙️ Quiz Settings</div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Time Limit (minutes)</label>
          <input
            type="number"
            className="form-input"
            min="0"
            placeholder="0 = No limit"
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
            <span>Shuffle question order</span>
          </label>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <label className="form-check">
            <input
              type="checkbox"
              checked={settings.showScoreImmediately ?? true}
              onChange={(e) => update('showScoreImmediately', e.target.checked)}
            />
            <span>Show score immediately</span>
          </label>
        </div>
      </div>
    </div>
  );
}
