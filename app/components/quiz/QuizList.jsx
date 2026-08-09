'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Skeleton from '../Skeleton';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz');
      const data = await res.json();
      if (data.quizzes) setQuizzes(data.quizzes);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-8 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#131A22] rounded-2xl p-5 border border-[#1F2937] w-72">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 bg-[#131A22] rounded-2xl border border-[#1F2937]">
        <div className="text-4xl mb-3">📝</div>
        <h3 className="font-display text-lg font-bold text-white mb-1 uppercase tracking-wider">No quizzes yet</h3>
        <p className="text-slate-400 text-sm">Generate your first quiz from your notes!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-8 px-4">
      {quizzes.map((quiz) => (
        <Link
          key={quiz.id}
          href={`/quiz/${quiz.id}`}
          className="bg-[#131A22] rounded-2xl p-5 border border-[#1F2937] hover:border-focus-cyan hover:shadow-focus-cyan transition-all group flex flex-col w-72"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-semibold text-white group-hover:text-focus-cyan transition-colors uppercase tracking-wide">
                {quiz.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {quiz._count?.questions || 0} questions · {quiz._count?.attempts || 0} attempts
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Created {quiz.createdAt ? new Date(quiz.createdAt).toISOString().split('T')[0] : ''}
              </p>
            </div>
            {quiz.attempts && quiz.attempts[0] && (
              <div className={`text-right px-3 py-1 rounded-full text-xs font-bold font-display uppercase tracking-wider ${
                (quiz.attempts[0].score / quiz.attempts[0].totalQuestions) >= 0.6 
                  ? 'bg-xp-green/20 text-xp-green border border-xp-green/50' 
                  : 'bg-streak-pink/20 text-streak-pink border border-streak-pink/50'
              }`}>
                {Math.round((quiz.attempts[0].score / quiz.attempts[0].totalQuestions) * 100)}%
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}