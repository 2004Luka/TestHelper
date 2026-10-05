import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page">
      <div className="hero">
        <h1 className="hero-title">
          Word to Quiz <span className="gradient-text">in Seconds</span>
        </h1>
        <p className="hero-subtitle">
          Upload your Word document test files, auto-generate shareable quiz links,
          and let students take tests online with instant auto-grading.
        </p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            ✨ Create Quiz
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            📊 My Quizzes
          </Link>
        </div>
      </div>

      <div className="feature-grid">
        <div className="card feature-card">
          <div className="feature-icon">📄</div>
          <div className="feature-title">Upload Word Files</div>
          <div className="feature-desc">
            Upload your test document and answer key as .docx files. 
            The parser extracts questions, options, and correct answers automatically.
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">🔗</div>
          <div className="feature-title">Share Link</div>
          <div className="feature-desc">
            Get a unique shareable link for each quiz. Send it to your students 
            and they can take the test from any device — no sign-up needed.
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">Instant Grading</div>
          <div className="feature-desc">
            Tests are graded automatically on submission. Students see their score, 
            correct answers, and can discuss results with the teacher.
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">📊</div>
          <div className="feature-title">Live Dashboard</div>
          <div className="feature-desc">
            Track every student's name, score, and attempt count in real-time. 
            Export results as CSV for your records.
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">💬</div>
          <div className="feature-title">Discussion</div>
          <div className="feature-desc">
            Teachers and students can discuss corrected tests in a built-in 
            comment thread — review mistakes together.
          </div>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">🎛️</div>
          <div className="feature-title">Configurable</div>
          <div className="feature-desc">
            Set time limits, shuffle questions, control score visibility, 
            and disable quiz links when you're done.
          </div>
        </div>
      </div>
    </div>
  );
}
