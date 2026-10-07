import mammoth from 'mammoth';

const GEORGIAN_LETTERS = ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ'];
const ENGLISH_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Helper to extract multiple options from a line or segment based on option markers (ა-ე, A-E).
 */
function extractOptionsFromLine(line, matches, currentQ) {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const startIdx = match.index + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : line.length;
    const optText = line.substring(startIdx, endIdx).replace(/[;.]\s*$/, '').trim();
    if (optText) {
      currentQ.options.push(optText);
    }
  }
}

/**
 * Determine question type and clean option strings.
 */
function finalizeQuestion(q) {
  let type = 'mcq';
  const cleanedOptions = q.options.map((o) => o.replace(/[;.]\s*$/, '').trim());

  if (
    cleanedOptions.length === 2 &&
    cleanedOptions.every((o) =>
      ['true', 'false', 'მართალია', 'მცდარია', 'კი', 'არა', 'ჭეშმარიტია'].includes(
        o.toLowerCase().trim()
      )
    )
  ) {
    type = 'truefalse';
  } else if (cleanedOptions.length === 0) {
    type = 'fillin';
  }

  return {
    questionNumber: q.questionNumber,
    questionText: q.questionText.trim(),
    type,
    options: cleanedOptions,
    correctAnswer: '',
  };
}

/**
 * Parse a .docx test file and extract all questions and their options in exact original order.
 * Supports:
 * - Numbered questions: "1.", "1)", "1 -", "1:", "1 ", "12რა", "25 . "
 * - Georgian options: "ა)", "ა.", "ა-", "ბ)", "ბ."
 * - English options: "A)", "A.", "A-", "B)", "B."
 * - Multiple options per line, single-line options, or wrapped multi-line options
 * - Questions with options on the question line itself
 */
export const parseTestDocument = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const questions = [];
  // Question header: line begins with digits, followed by optional punctuation/spaces and content
  const qRegex = /^(\d+)\s*[.)\-:]*\s*(.+)$/;
  // Option marker: Georgian (ა-ე/ვ) or English (A-E/F) followed by dot, paren, or dash
  const optMarkerRegex = /(?:^|\s+)([ა-ეA-Ea-e])\s*([.)\-])\s*/g;

  let currentQ = null;

  for (const line of rawLines) {
    const qMatch = line.match(qRegex);
    // Sanity check: question numbers in tests are typically <= 500 (avoids treating years like 1921 as questions)
    const isLikelyQuestion = qMatch && parseInt(qMatch[1], 10) <= 500;

    if (isLikelyQuestion) {
      if (currentQ) {
        questions.push(finalizeQuestion(currentQ));
      }

      const qNum = parseInt(qMatch[1], 10);
      const fullContent = qMatch[2].trim();

      // Check if this line itself also contains option markers (e.g. question and options on same line)
      const optMatches = [...fullContent.matchAll(optMarkerRegex)];
      if (optMatches.length > 0) {
        const qText = fullContent.substring(0, optMatches[0].index).trim();
        currentQ = {
          questionNumber: qNum,
          questionText: qText,
          options: [],
        };
        extractOptionsFromLine(fullContent, optMatches, currentQ);
      } else {
        currentQ = {
          questionNumber: qNum,
          questionText: fullContent,
          options: [],
        };
      }
    } else if (currentQ) {
      // Line is either option(s), option continuation, or question text continuation
      const optMatches = [...line.matchAll(optMarkerRegex)];
      if (optMatches.length > 0) {
        extractOptionsFromLine(line, optMatches, currentQ);
      } else {
        if (currentQ.options.length > 0) {
          // Wrapped multi-line option text — append to current option
          currentQ.options[currentQ.options.length - 1] += ' ' + line;
        } else {
          // Wrapped multi-line question text — append to question text
          currentQ.questionText += ' ' + line;
        }
      }
    }
  }

  if (currentQ) {
    questions.push(finalizeQuestion(currentQ));
  }

  return questions;
};

/**
 * Parse a .docx answer key file.
 * Handles:
 * - Multi-column lines (e.g. "1.გ         28.ბ   ტესტი 1")
 * - Single-column lines (e.g. "1. B", "1) გ", "1 - True")
 * - Space-separated letter answers (e.g. "1 გ", "2 B")
 * - Text answers (e.g. "1. ოსირისი")
 * - Plain lines with only answers without numbers as fallback
 */
export const parseAnswerKey = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const answers = {};

  // 1. Match number followed by punctuation [.)\-:] and answer token (supports multiple pairs per line)
  const pairRegex = /(?:^|[\s\t]+)(\d+)\s*[.)\-:]\s*([^\s\t\r\n,;]+)/g;
  let match;
  while ((match = pairRegex.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ansText = match[2].replace(/[;,.]\s*$/, '').trim();
    if (!isNaN(qNum) && ansText) {
      answers[qNum] = ansText;
    }
  }

  // 2. Match number followed by space and single letter answer (e.g. "1 გ", "2 B")
  const spaceLetterRegex = /(?:^|[\s\t]+)(\d+)\s+([ა-ეA-Ea-e])(?=[\s\t\r\n]|$)/g;
  while ((match = spaceLetterRegex.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ansText = match[2].trim();
    if (!isNaN(qNum) && !answers[qNum]) {
      answers[qNum] = ansText;
    }
  }

  // 3. Fallback: line-by-line fallback for documents with one answer per line without numbering
  if (Object.keys(answers).length === 0) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    lines.forEach((line, idx) => {
      const lineMatch = line.match(/^(\d+)\s*[.)\-:]?\s*(.+)$/);
      if (lineMatch) {
        const qNum = parseInt(lineMatch[1], 10);
        answers[qNum] = lineMatch[2].replace(/[;,.]\s*$/, '').trim();
      } else {
        answers[idx + 1] = line.replace(/[;,.]\s*$/, '').trim();
      }
    });
  }

  return answers;
};

/**
 * Merge parsed questions with answer key in exact order without shifting.
 * Supports Georgian (ა-ვ) and English (A-F) letters, 1-based numbers, or exact text matching.
 */
export const mergeQuestionsWithAnswers = (questions, answers) => {
  return questions.map((q, i) => {
    // 1-based question number: use questionNumber if parsed, else fallback to 1-based index (i + 1)
    const qNum = q.questionNumber || (i + 1);
    const rawAnswer = (answers[qNum] || answers[i + 1] || answers[i] || '').trim();

    if (q.type === 'mcq' && q.options.length > 0) {
      // 1. Georgian letter match (ა, ბ, გ, დ, ე, ვ)
      const geoIdx = GEORGIAN_LETTERS.indexOf(rawAnswer.toLowerCase());
      if (geoIdx !== -1 && geoIdx < q.options.length) {
        return { ...q, correctAnswer: q.options[geoIdx] };
      }

      // 2. English letter match (A, B, C, D, E, F)
      const engIdx = ENGLISH_LETTERS.indexOf(rawAnswer.toUpperCase());
      if (engIdx !== -1 && engIdx < q.options.length) {
        return { ...q, correctAnswer: q.options[engIdx] };
      }

      // 3. Numeric option index (e.g. 1 -> options[0], 2 -> options[1])
      if (/^\d+$/.test(rawAnswer)) {
        const numIdx = parseInt(rawAnswer, 10) - 1;
        if (numIdx >= 0 && numIdx < q.options.length) {
          return { ...q, correctAnswer: q.options[numIdx] };
        }
      }

      // 4. Direct text matching against options
      const matchedOpt = q.options.find(
        (opt) => opt.toLowerCase().trim() === rawAnswer.toLowerCase().trim()
      );
      if (matchedOpt) {
        return { ...q, correctAnswer: matchedOpt };
      }

      // Fallback: raw answer or first option if no match found
      return { ...q, correctAnswer: rawAnswer || q.options[0] };
    }

    if (q.type === 'truefalse') {
      const isTrue = ['true', 'ჭეშმარიტია', 'მართალია', 'კი', 't', '1'].includes(
        rawAnswer.toLowerCase()
      );
      const isFalse = ['false', 'მცდარია', 'არა', 'ტყუილია', 'f', '0'].includes(
        rawAnswer.toLowerCase()
      );

      if (isTrue || isFalse) {
        const targetWord = isTrue ? ['true', 'ჭეშმარიტია', 'მართალია', 'კი'] : ['false', 'მცდარია', 'არა'];
        const matched = q.options.find((o) =>
          targetWord.includes(o.toLowerCase().trim())
        );
        if (matched) return { ...q, correctAnswer: matched };
      }
    }

    return { ...q, correctAnswer: rawAnswer };
  });
};
