const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateQuizWithGemini(notes) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in .env.local');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // ✅ Updated model
      messages: [{
        role: 'user',
        content: `You are a quiz generator. Based on these study notes, create a quiz.

STRICT RULES:
- Return ONLY valid JSON. No markdown, no explanations, no code blocks.
- Use this exact structure:

{
  "title": "Short descriptive title",
  "questions": [
    {
      "type": "MCQ",
      "question": "Question text?",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ],
      "answer": "Option B"
    },
    {
      "type": "TRUE_FALSE",
      "question": "Statement.",
      "answer": true
    },
    {
      "type": "SHORT_ANSWER",
      "question": "Question?",
      "answer": "Model answer"
    }
  ]
}

CRITICAL: For MCQ questions, you MUST include both:
1. options array with isCorrect flags on each option
2. answer field with the exact text of the correct option

Generate exactly 3 MCQs, 2 True/False, 2 Short Answer.

Notes: ${notes}`
      }],
      temperature: 0.2,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate quiz');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  
  const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsedQuiz = JSON.parse(cleanJson);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[quiz-debug] generated quiz payload', JSON.stringify({
      title: parsedQuiz?.title,
      questionCount: parsedQuiz?.questions?.length ?? 0,
      questions: parsedQuiz?.questions?.map((question) => ({
        type: question?.type,
        hasOptions: Array.isArray(question?.options),
        answerType: typeof question?.answer,
        answerValue: question?.answer,
      })) ?? []
    }, null, 2));
  }

  return parsedQuiz;
}