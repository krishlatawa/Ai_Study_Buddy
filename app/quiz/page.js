'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuizList from '@/app/components/quiz/QuizList';
import { useSession } from "next-auth/react";

export default function QuizHubPage() {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const generateQuiz = async () => {
    if (!notes.trim() || notes.trim().length < 10) {
      setError('Please enter meaningful notes (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      // Navigate to the new quiz
      router.push(`/quiz/${data.quiz.id}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] py-8 px-4 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-combo-purple/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-focus-cyan/10 blur-[100px]" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-xp-green animate-pulse" />
            <p className="font-display text-sm font-bold tracking-[0.2em] text-combo-purple uppercase text-glow-purple">
              Quiz Module v1.0
            </p>
          </div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl leading-[0.95]">
            AI Quiz <span className="text-xp-green text-glow-green">Generator</span>
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Paste your notes and let AI create a quiz for you
          </p>
        </div>

        {/* Generate Section */}
        <div className="bg-[#131A22] rounded-2xl p-6 border border-[#1F2937] mb-8 shadow-lg">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2 font-display uppercase tracking-wider">
            Your Study Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setError('');
            }}
            placeholder="Paste your notes here. The more detailed, the better the questions!

Example:
The water cycle involves evaporation, condensation, and precipitation. Water evaporates from oceans, forms clouds through condensation, and falls as rain or snow. This continuous process is essential for life on Earth."
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "notes-error" : undefined}
            className="w-full h-48 p-4 bg-[#0B0F14] border-2 border-[#1F2937] rounded-xl focus:border-focus-cyan focus:shadow-focus-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14] resize-y text-slate-300 placeholder-slate-500 transition-all"
          />
          {error && (
            <p id="notes-error" className="text-streak-pink text-sm mt-2 flex items-center gap-1 font-semibold" role="alert" aria-live="polite">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full min-h-[44px] mt-4 bg-xp-green text-[#0B0F14] py-3.5 rounded-xl font-display font-black uppercase tracking-wider hover:shadow-xp-green hover:scale-[1.02] disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-xp-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Quiz with AI...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Quiz
              </>
            )}
          </button>
        </div>

        {/* Quiz List */}
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white mb-4">
            Your <span className="text-focus-cyan text-glow-cyan">Quizzes</span>
          </h2>
          <div className="flex justify-center">
            <QuizList />
          </div>
        </div>
      </div>
    </div>
  );
}