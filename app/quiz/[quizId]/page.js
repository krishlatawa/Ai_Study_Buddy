'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MCQCard from '@/app/components/quiz/MCQCard';
import TrueFalseCard from '@/app/components/quiz/TrueFalseCard';
import ShortAnswerCard from '@/app/components/quiz/ShortAnswerCard';
import QuizResults from '@/app/components/quiz/QuizResults';

export default function TakeQuizPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(() => Date.now());

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/${quizId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch quiz: ${res.status} ${text}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Unexpected response type: ${contentType}\n${text}`);
      }
      const data = await res.json();
      if (data.quiz) setQuiz(data.quiz);
    } catch (err) {
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void Promise.resolve().then(fetchQuiz);
  }, [fetchQuiz]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    if (process.env.NODE_ENV !== 'production') {
      console.log('[quiz-debug] client submit payload', JSON.stringify({
        quizId,
        answerCount: formattedAnswers.length,
        answers: formattedAnswers,
      }, null, 2));
    }

    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers, timeTaken }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Submit failed: ${res.status} ${text}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Unexpected response type on submit: ${contentType}\n${text}`);
      }
      const data = await res.json();
      if (data.success) {
        // ✅ XP data is now included in data.attempt from API
        setResult(data.attempt);
      } else {
        throw new Error(data.error || 'Submission error');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz ? quiz.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '') : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Quiz not found</h2>
          <button onClick={() => router.push('/quiz')} className="mt-4 text-blue-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <QuizResults
          result={result}  // ✅ Passes full result with XP data
          onRetry={() => {
            setAnswers({});
            setResult(null);
            fetchQuiz();
          }}
          onBack={() => router.push('/quiz')}
        />
      </div>
    );
  }

  const mcqs = quiz.questions.filter(q => q.type === 'MCQ');
  const trueFalse = quiz.questions.filter(q => q.type === 'TRUE_FALSE');
  const shortAnswers = quiz.questions.filter(q => q.type === 'SHORT_ANSWER');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {quiz.questions.length} questions • Answer all to submit
            </p>
          </div>
          <button
            onClick={() => router.push('/quiz')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Quizzes
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-full h-2 mb-8 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-2">
          {mcqs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Multiple Choice ({mcqs.length})
              </h2>
              {mcqs.map((q, i) => (
                <MCQCard
                  key={q.id}
                  question={q}
                  index={i}
                  onAnswer={(ans) => handleAnswer(q.id, ans)}
                  disabled={submitting}
                />
              ))}
            </div>
          )}

          {trueFalse.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                True or False ({trueFalse.length})
              </h2>
              {trueFalse.map((q, i) => (
                <TrueFalseCard
                  key={q.id}
                  question={q}
                  index={mcqs.length + i}
                  onAnswer={(ans) => handleAnswer(q.id, ans)}
                  disabled={submitting}
                />
              ))}
            </div>
          )}

          {shortAnswers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Short Answer ({shortAnswers.length})
              </h2>
              {shortAnswers.map((q, i) => (
                <ShortAnswerCard
                  key={q.id}
                  question={q}
                  index={mcqs.length + trueFalse.length + i}
                  onAnswer={(ans) => handleAnswer(q.id, ans)}
                  disabled={submitting}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="sticky bottom-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {Object.keys(answers).length} of {quiz.questions.length} answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
