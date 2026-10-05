import mammoth from 'mammoth';

/**
 * Parse a .docx test file and extract questions.
 * Supports: numbered questions (1. / 1)), letter options (A) / A.), true/false, fill-in-blank
 */
export const parseTestDocument = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const questions = [];
  let i = 0;

  while (i < lines.length) {
    // Match: "1. Question text" or "1) Question text"
    const qMatch = lines[i].match(/^(\d+)[.)]\s*(.+)/);

    if (qMatch) {
      const questionText = qMatch[2];
      const options = [];
      i++;

      // Collect letter options: A) / a. / A. etc.
      while (i < lines.length) {
        const optMatch = lines[i].match(/^([A-Da-d])[.)]\s*(.+)/);
        if (optMatch) {
          options.push(optMatch[2].trim());
          i++;
        } else {
          break;
        }
      }

      // Detect question type
      let type = 'mcq';
      if (
        options.length === 2 &&
        options.every((o) => ['true', 'false'].includes(o.toLowerCase()))
      ) {
        type = 'truefalse';
      } else if (options.length === 0) {
        type = 'fillin';
      }

      questions.push({ questionText, type, options, correctAnswer: '' });
    } else {
      i++;
    }
  }

  return questions;
};

/**
 * Parse a .docx answer key file.
 * Expected format per line: "1. B" or "1) True" or "1. Paris"
 */
export const parseAnswerKey = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const answers = {};

  for (const line of lines) {
    const match = line.match(/^(\d+)[.)]\s*(.+)/);
    if (match) {
      answers[parseInt(match[1]) - 1] = match[2].trim(); // 0-indexed
    }
  }

  return answers;
};

/**
 * Merge parsed questions with answer key.
 * If answer is a letter (A-D), resolve it to the actual option text.
 */
export const mergeQuestionsWithAnswers = (questions, answers) => {
  return questions.map((q, i) => {
    const answer = answers[i] || '';

    // MCQ with letter answer → resolve to option text
    if (q.type === 'mcq' && q.options.length > 0) {
      const letterMatch = answer.match(/^([A-Da-d])$/);
      if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < q.options.length) {
          return { ...q, correctAnswer: q.options[idx] };
        }
      }
    }

    return { ...q, correctAnswer: answer };
  });
};
