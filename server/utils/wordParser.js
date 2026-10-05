import mammoth from 'mammoth';

const GEORGIAN_LETTERS = ['ა', 'ბ', 'გ', 'დ', 'ე'];
const ENGLISH_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Parse a .docx test file and extract questions.
 * Supports Georgian (ა, ბ, გ, დ) and English (A, B, C, D) options,
 * single-line or multi-line options, numbered questions (1. / 1) / 1 / 12რა იყო).
 */
export const parseTestDocument = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const questions = [];

  // Question header regex: starts with digits, optional dot/paren/space, then question text
  const qRegex = /^(\d+)[.)\s]?\s*(.+)/;
  // Option marker check regex: matches Georgian (ა-ე) or English (A-E) option prefixes
  const optionMarkerRegex = /(?:^|\s+)[ა-ეA-Ea-e1-5][.)\s]/;

  let currentQuestion = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const hasOptionMarkers = optionMarkerRegex.test(line);
    const qMatch = line.match(qRegex);

    // New question start (must start with digit and NOT be an option marker)
    if (qMatch && !hasOptionMarkers) {
      if (currentQuestion) {
        questions.push(finalizeQuestion(currentQuestion));
      }
      currentQuestion = {
        questionText: qMatch[2].trim(),
        type: 'mcq',
        options: [],
        correctAnswer: '',
      };
    } else if (currentQuestion) {
      if (hasOptionMarkers) {
        // Split line by option markers e.g. "ა) ...  ბ) ..." or "A. ... B. ..."
        const parts = line
          .split(/(?=(?:^|\s+)[ა-ეA-Ea-e1-5][.)\s])/)
          .map((p) => p.trim())
          .filter(Boolean);

        for (const part of parts) {
          const optMatch = part.match(/^([ა-ეA-Ea-e1-5])[.)\s]\s*(.+)/);
          if (optMatch) {
            const cleanOptText = optMatch[2].replace(/[;.]\s*$/, '').trim();
            currentQuestion.options.push(cleanOptText);
          }
        }
      } else {
        // Additional question text lines if options haven't started yet
        if (currentQuestion.options.length === 0) {
          currentQuestion.questionText += ' ' + line;
        }
      }
    }
  }

  if (currentQuestion) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  return questions;
};

/**
 * Determine final question type based on extracted options.
 */
function finalizeQuestion(q) {
  let type = 'mcq';
  if (
    q.options.length === 2 &&
    q.options.every((o) =>
      ['true', 'false', 'მართალია', 'მცდარია', 'კი', 'არა'].includes(
        o.toLowerCase()
      )
    )
  ) {
    type = 'truefalse';
  } else if (q.options.length === 0) {
    type = 'fillin';
  }
  return { ...q, type };
}

/**
 * Parse a .docx answer key file.
 * Expected format per line: "1. B" or "1) გ" or "1. True" or "1. ოსირისი"
 */
export const parseAnswerKey = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const answers = {};

  // 1. Match inline number + answer pairs e.g. "1. ა", "2) B", "3. ოსირისი"
  const pairRegex = /(?:^|\s+|\n)(\d+)[.)\s]\s*([ა-ეA-Ea-e1-5]|[^\s,;\n]+)/g;
  let match;
  while ((match = pairRegex.exec(text)) !== null) {
    const qNum = parseInt(match[1]);
    const ansText = match[2].replace(/[;,.]\s*$/, '').trim();
    if (!isNaN(qNum) && ansText) {
      answers[qNum - 1] = ansText;
    }
  }

  // 2. Line-by-line fallback for full text answers per line
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lineMatch = line.match(/^(\d+)[.)\s]?\s*(.+)/);
    if (lineMatch) {
      const idx = parseInt(lineMatch[1]) - 1;
      if (!answers[idx]) {
        answers[idx] = lineMatch[2].replace(/[;,.]\s*$/, '').trim();
      }
    }
  }

  return answers;
};

/**
 * Merge parsed questions with answer key.
 * Supports Georgian (ა-ე) and English (A-E) option letters, or direct text matching.
 */
export const mergeQuestionsWithAnswers = (questions, answers) => {
  return questions.map((q, i) => {
    const rawAnswer = (answers[i] || '').trim();

    if (q.type === 'mcq' && q.options.length > 0) {
      // 1. Georgian letter match (ა, ბ, გ, დ, ე)
      const geoIdx = GEORGIAN_LETTERS.indexOf(rawAnswer.toLowerCase());
      if (geoIdx !== -1 && geoIdx < q.options.length) {
        return { ...q, correctAnswer: q.options[geoIdx] };
      }

      // 2. English letter match (A, B, C, D, E)
      const engIdx = ENGLISH_LETTERS.indexOf(rawAnswer.toUpperCase());
      if (engIdx !== -1 && engIdx < q.options.length) {
        return { ...q, correctAnswer: q.options[engIdx] };
      }

      // 3. Direct string option match
      const matchedOpt = q.options.find(
        (opt) => opt.toLowerCase() === rawAnswer.toLowerCase()
      );
      if (matchedOpt) {
        return { ...q, correctAnswer: matchedOpt };
      }

      // Fallback for MCQ if answer key item was missing: use first option
      return { ...q, correctAnswer: rawAnswer || q.options[0] };
    }

    return { ...q, correctAnswer: rawAnswer };
  });
};
