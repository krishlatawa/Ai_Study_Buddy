/**
 * Utility functions to normalize quiz content from LLMs (Gemini/Groq)
 * and user submissions to avoid shape mismatches during grading.
 */

/**
 * Strips leading option labels like "A)", "B.", "1)", "a - " from text.
 */
export function cleanOptionText(text) {
  if (typeof text !== 'string') return String(text ?? '').trim();
  return text.replace(/^[A-Za-z0-9]\s*[\)\.\:\-]\s*/, '').trim();
}

/**
 * Coerces boolean inputs ("true", "True", true, "1", "false", "False", false, "0") to boolean.
 */
export function toBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    if (clean === 'true' || clean === 'yes' || clean === '1' || clean === 't') return true;
    if (clean === 'false' || clean === 'no' || clean === '0' || clean === 'f') return false;
  }
  return Boolean(val);
}

/**
 * Determines which option index (0-3) corresponds to the answer string/number.
 */
export function findCorrectOptionIndex(rawOptions, answerVal) {
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) return -1;

  // 1. Check if an option object already has isCorrect: true
  const explicitIdx = rawOptions.findIndex((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return toBoolean(opt.isCorrect ?? opt.correct ?? false);
    }
    return false;
  });
  if (explicitIdx !== -1) return explicitIdx;

  if (answerVal === undefined || answerVal === null) return 0;

  // 2. If answerVal is a number index
  if (typeof answerVal === 'number' && answerVal >= 0 && answerVal < rawOptions.length) {
    return answerVal;
  }

  const strAns = String(answerVal).trim();
  const cleanAns = cleanOptionText(strAns).toLowerCase();

  // 3. Match by exact or cleaned text
  const textIdx = rawOptions.findIndex((opt) => {
    const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.option || '');
    return cleanOptionText(optText).toLowerCase() === cleanAns;
  });
  if (textIdx !== -1) return textIdx;

  // 4. Match single letter (A=0, B=1, C=2, D=3)
  const letterMatch = strAns.match(/^(?:option\s*)?([A-D])$/i);
  if (letterMatch) {
    const letterIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (letterIdx >= 0 && letterIdx < rawOptions.length) {
      return letterIdx;
    }
  }

  // 5. Partial string inclusion match
  const partialIdx = rawOptions.findIndex((opt) => {
    const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.option || '');
    const cleanOpt = cleanOptionText(optText).toLowerCase();
    return cleanOpt.includes(cleanAns) || cleanAns.includes(cleanOpt);
  });

  return partialIdx !== -1 ? partialIdx : 0;
}

/**
 * Normalizes a single generated question before saving into database.
 */
export function normalizeQuestionData(q) {
  if (!q || typeof q !== 'object') {
    throw new Error('Invalid question object');
  }

  const type = String(q.type || '').toUpperCase().trim();
  const questionText = String(q.question || '').trim();

  if (!['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(type)) {
    throw new Error(`Unsupported question type: ${type}`);
  }

  if (type === 'MCQ') {
    let rawOptions = q.options;
    if (!Array.isArray(rawOptions) && typeof rawOptions === 'object' && rawOptions !== null) {
      rawOptions = Object.values(rawOptions);
    }
    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      throw new Error(`MCQ question "${questionText}" missing options array`);
    }

    const correctIndex = findCorrectOptionIndex(rawOptions, q.answer);

    const normalizedOptions = rawOptions.map((opt, idx) => {
      const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.option || opt?.answer || '');
      return {
        text: cleanOptionText(optText),
        isCorrect: idx === correctIndex,
      };
    });

    const correctAnswerText = normalizedOptions[correctIndex]?.text || '';

    return {
      type: 'MCQ',
      question: questionText,
      options: normalizedOptions,
      answer: correctAnswerText, // ✅ Always populate explicit answer text column
    };
  }

  if (type === 'TRUE_FALSE') {
    let rawAns = q.answer;
    if (rawAns === undefined || rawAns === null) {
      if (Array.isArray(q.options)) {
        const correctOpt = q.options.find((opt) => toBoolean(opt.isCorrect ?? opt.correct));
        if (correctOpt) rawAns = correctOpt.text;
      }
    }
    const boolAns = toBoolean(rawAns);

    return {
      type: 'TRUE_FALSE',
      question: questionText,
      options: null,
      answer: boolAns,
    };
  }

  if (type === 'SHORT_ANSWER') {
    let strAns = q.answer;
    if (Array.isArray(strAns)) strAns = strAns.join(', ');
    strAns = String(strAns ?? '').trim();

    return {
      type: 'SHORT_ANSWER',
      question: questionText,
      options: null,
      answer: strAns,
    };
  }

  return q;
}

/**
 * Normalizes generated quiz object containing array of questions.
 */
export function normalizeQuizPayload(quizData) {
  if (!quizData || typeof quizData !== 'object') {
    throw new Error('Invalid quiz payload');
  }

  const title = String(quizData.title || 'Untitled Quiz').trim();
  const rawQuestions = Array.isArray(quizData.questions) ? quizData.questions : [];

  if (rawQuestions.length === 0) {
    throw new Error('Quiz must contain at least one question');
  }

  const questions = rawQuestions.map((q, idx) => {
    const normalized = normalizeQuestionData(q);
    return { ...normalized, order: idx };
  });

  return { title, questions };
}

/**
 * Normalizes user answer and evaluates correctness against stored question.
 */
export function evaluateAnswer(question, userAnswer) {
  if (!question) return { isCorrect: false, normalizedUserAnswer: '' };

  const type = question.type;

  if (type === 'MCQ') {
    const cleanUser = cleanOptionText(String(userAnswer ?? ''));
    const options = Array.isArray(question.options) ? question.options : [];

    // 1. Match against explicit question.answer stored in DB column
    let correctAnswerText = '';
    if (typeof question.answer === 'string' && question.answer.trim()) {
      correctAnswerText = cleanOptionText(question.answer);
    }

    // 2. If question.answer was empty/null, find option object with isCorrect: true
    if (!correctAnswerText) {
      const correctOpt = options.find(
        (opt) => typeof opt === 'object' && opt !== null && toBoolean(opt.isCorrect ?? opt.correct)
      );
      if (correctOpt) {
        correctAnswerText = cleanOptionText(correctOpt.text || '');
      }
    }

    // 3. Fallback: resolve via findCorrectOptionIndex
    if (!correctAnswerText && question.answer !== undefined && question.answer !== null) {
      const correctIdx = findCorrectOptionIndex(options, question.answer);
      if (correctIdx >= 0 && correctIdx < options.length) {
        const rawOpt = options[correctIdx];
        correctAnswerText = cleanOptionText(typeof rawOpt === 'string' ? rawOpt : (rawOpt?.text || rawOpt?.option || ''));
      }
    }

    const isCorrect = Boolean(cleanUser && correctAnswerText && cleanUser.toLowerCase() === correctAnswerText.toLowerCase());

    console.log(`🔍 [GRADING MCQ] Q: "${question.question?.slice(0, 35)}..." | User: "${cleanUser}" | Expected: "${correctAnswerText}" | Result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);

    return { isCorrect, normalizedUserAnswer: cleanUser };
  }

  if (type === 'TRUE_FALSE') {
    const userBool = toBoolean(userAnswer);
    const expectedBool = toBoolean(question.answer);
    const isCorrect = userBool === expectedBool;

    console.log(`🔍 [GRADING T/F] Q: "${question.question?.slice(0, 35)}..." | User: ${userBool} | Expected: ${expectedBool} | Result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);

    return { isCorrect, normalizedUserAnswer: userBool };
  }

  if (type === 'SHORT_ANSWER') {
    const cleanUser = String(userAnswer ?? '').trim().toLowerCase();
    const cleanExpected = String(question.answer ?? '').trim().toLowerCase();

    if (!cleanUser || !cleanExpected) {
      console.log(`🔍 [GRADING SHORT] Q: "${question.question?.slice(0, 35)}..." | User: "${cleanUser}" | Expected: "${cleanExpected}" | Result: ❌ INCORRECT (empty)`);
      return { isCorrect: false, normalizedUserAnswer: String(userAnswer ?? '') };
    }

    // Direct inclusion / equality
    if (
      cleanUser === cleanExpected ||
      cleanUser.includes(cleanExpected) ||
      cleanExpected.includes(cleanUser)
    ) {
      console.log(`🔍 [GRADING SHORT] Q: "${question.question?.slice(0, 35)}..." | User: "${cleanUser}" | Expected: "${cleanExpected}" | Result: ✅ CORRECT (inclusion)`);
      return { isCorrect: true, normalizedUserAnswer: String(userAnswer ?? '').trim() };
    }

    // Key word overlap matching
    const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'of', 'to', 'in', 'that', 'this', 'it', 'for', 'with', 'on', 'as']);
    const extractWords = (str) => str.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const expectedWords = extractWords(cleanExpected);
    const userWords = new Set(extractWords(cleanUser));

    if (expectedWords.length > 0) {
      const matchCount = expectedWords.filter((w) => userWords.has(w)).length;
      const matchRatio = matchCount / expectedWords.length;
      if (matchRatio >= 0.5) {
        console.log(`🔍 [GRADING SHORT] Q: "${question.question?.slice(0, 35)}..." | User: "${cleanUser}" | Expected: "${cleanExpected}" | Result: ✅ CORRECT (${Math.round(matchRatio * 100)}% keyword match)`);
        return { isCorrect: true, normalizedUserAnswer: String(userAnswer ?? '').trim() };
      }
    }

    console.log(`🔍 [GRADING SHORT] Q: "${question.question?.slice(0, 35)}..." | User: "${cleanUser}" | Expected: "${cleanExpected}" | Result: ❌ INCORRECT`);
    return { isCorrect: false, normalizedUserAnswer: String(userAnswer ?? '').trim() };
  }

  return { isCorrect: false, normalizedUserAnswer: String(userAnswer ?? '') };
}
