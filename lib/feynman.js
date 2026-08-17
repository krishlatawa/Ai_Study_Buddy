const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * STEP 2A: Generates structured Q&A pairs from user's notes
 * Returns: [{ id, question, expectedAnswer, explanation }]
 */
export async function generateQuestions(topic, notes) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env.local');

  const prompt = `You are an expert tutor. Based on the topic "${topic}" and the study notes below, generate 7-10 structured Q&A pairs that test a student's understanding.

RULES:
- Questions should progress from basic → intermediate → deep understanding
- Each question must have a clear, unambiguous expected answer
- Include an explanation that teaches the concept (used when student gets it wrong)
- Mix of: "What is X?", "How does X work?", "Why does X happen?", "Explain the relationship between X and Y"

STUDY NOTES:
${notes || 'No specific notes provided. Generate questions based on general knowledge of the topic.'}

Return ONLY valid JSON — no markdown, no code fences. Use this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "What is [concept] in simple terms?",
      "expectedAnswer": "The correct answer is...",
      "explanation": "A fuller explanation teaching why this is the right answer and what the key details are..."
    }
  ]
}

Generate exactly 7 questions. Make them specific and test real understanding, not just definitions.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a precise quiz generator. You output ONLY valid JSON arrays of questions. No conversation, no extra text.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate questions');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  // Clean and parse JSON
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI JSON. Raw:', text.substring(0, 200));
    // Fallback: return basic questions
    return generateFallbackQuestions(topic);
  }

  const questions = parsed.questions || parsed;
  if (!Array.isArray(questions) || questions.length === 0) {
    return generateFallbackQuestions(topic);
  }

  // Normalize IDs
  return questions.map((q, i) => ({
    id: i + 1,
    question: q.question || `Explain ${topic} in simple terms.`,
    expectedAnswer: q.expectedAnswer || 'See explanation.',
    explanation: q.explanation || `The correct answer relates to ${topic}. Please review your notes.`
  }));
}

/**
 * Fallback questions if AI fails
 */
function generateFallbackQuestions(topic) {
  return [
    { id: 1, question: `What is ${topic} in simple terms?`, expectedAnswer: `${topic} is a concept that involves...`, explanation: `Try to define ${topic} in your own words without using technical jargon.` },
    { id: 2, question: `What are the key components or steps involved in ${topic}?`, expectedAnswer: `The key components are...`, explanation: `Break down ${topic} into its main parts.` },
    { id: 3, question: `How does ${topic} work at a basic level?`, expectedAnswer: `${topic} works by...`, explanation: `Explain the mechanism or process behind ${topic}.` },
    { id: 4, question: `Why is ${topic} important or useful?`, expectedAnswer: `${topic} is important because...`, explanation: `Consider the practical applications and significance.` },
    { id: 5, question: `Can you give a real-world example of ${topic}?`, expectedAnswer: `A real-world example is...`, explanation: `Connect ${topic} to something familiar.` },
    { id: 6, question: `What is a common misconception about ${topic}?`, expectedAnswer: `A common misconception is that...`, explanation: `Clarify what ${topic} is NOT.` },
    { id: 7, question: `How does ${topic} relate to other concepts in this field?`, expectedAnswer: `${topic} relates to...`, explanation: `Connect ${topic} to broader knowledge.` },
  ];
}

/**
 * STEP 2B: Evaluates a student's answer against the expected answer
 * Returns: { isCorrect: boolean, feedback: string, explanation: string }
 * 
 * If correct → feedback is short affirmation
 * If wrong → feedback includes the correct answer + explanation
 */
export async function gradeAnswer(userAnswer, questionObj) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env.local');

  const prompt = `You are grading a student's answer to a question.

QUESTION: "${questionObj.question}"
EXPECTED ANSWER: "${questionObj.expectedAnswer}"
STUDENT'S ANSWER: "${userAnswer}"

Evaluate the student's answer:
- Is it CORRECT (matches the expected answer in meaning, not necessarily word-for-word)?
- Is it PARTIALLY CORRECT (has the right idea but misses key details)?
- Is it WRONG (doesn't match the expected answer at all)?

Return ONLY valid JSON:
{
  "isCorrect": true/false,
  "feedback": "Short, direct feedback to the student. If correct: '✅ Correct! Well explained.' If partially correct: '✅ Mostly right! Just remember that [specific missing detail].' If wrong: '❌ Not quite. The correct answer is: ${questionObj.expectedAnswer}'",
  "explanation": "${questionObj.explanation}"
}

Rules:
- Be generous with correct answers — accept different phrasings as long as the meaning is right
- For partially correct, still mark as correct but give constructive feedback
- For wrong answers, clearly state the correct answer
- Keep feedback concise and encouraging`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a fair but thorough grader. You evaluate understanding, not exact wording. Output ONLY valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to grade answer');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  try {
    const result = JSON.parse(cleaned);
    return {
      isCorrect: result.isCorrect === true,
      feedback: result.feedback || (result.isCorrect ? '✅ Correct!' : '❌ Not quite.'),
      explanation: result.explanation || questionObj.explanation,
    };
  } catch (e) {
    // Fallback grading: simple keyword matching
    const isCorrect = userAnswer.toLowerCase().includes(questionObj.expectedAnswer.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase());
    return {
      isCorrect,
      feedback: isCorrect ? '✅ Correct!' : `❌ Not quite. The correct answer is: ${questionObj.expectedAnswer}`,
      explanation: questionObj.explanation,
    };
  }
}

