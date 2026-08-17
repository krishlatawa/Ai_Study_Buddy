'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FeynmanSessionPage() {
  const sessionId = useParams().sessionId;
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [result, setResult] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null); // { isCorrect, feedback, questionId }
  const messagesEndRef = useRef(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/feynman/${sessionId}`);
      const data = await res.json();
      if (data.success) setSession(data.session);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void Promise.resolve().then(fetchSession);
  }, [fetchSession]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.exchanges, answerFeedback]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setSendError('');
    setAnswerFeedback(null);

    // Optimistically add student message
    setSession((prev) => {
      if (!prev) return prev;
      const ex = prev.exchanges || [];
      return { ...prev, exchanges: [...ex, { role: 'student', message: userMessage, id: 'temp', order: ex.length }] };
    });

    try {
      const res = await fetch(`/api/feynman/${sessionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Show feedback banner
      if (data.exchange?.grade) {
        setAnswerFeedback({
          isCorrect: data.exchange.grade.isCorrect,
          feedback: data.exchange.grade.feedback,
          explanation: data.exchange.grade.explanation,
        });
      }

      if (data.sessionStatus === 'COMPLETED') {
        // Session completed!
        await fetchSession();
        setResult({
          score: data.finalSummary?.score || 0,
          totalQuestions: data.finalSummary?.totalQuestions || 0,
          percentage: data.finalSummary?.percentage || 0,
          xpEarned: data.finalSummary?.xpEarned || 0,
          isComplete: true,
        });
      } else {
        // Normal exchange — add both messages
        setSession((prev) => {
          if (!prev) return prev;
          const f = prev.exchanges.filter((e) => e.id !== 'temp');
          return {
            ...prev,
            score: data.currentScore || prev.score,
            currentQuestionIndex: (data.currentQuestion || 1) - 1,
            exchanges: [
              ...f,
              { role: 'student', message: userMessage, id: `s-${Date.now()}`, order: f.length },
              { role: 'ai', message: data.exchange.message, id: `a-${Date.now()}`, order: f.length + 1 }
            ]
          };
        });
      }
    } catch (err) {
      // Remove the temp message on error
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, exchanges: (prev.exchanges || []).filter((e) => e.id !== 'temp') };
      });
      setSendError(err.message || 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-focus-cyan"></div>
      </div>
    );
  }

  // --- Session not found ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Session not found</p>
          <button onClick={() => router.push('/feynman')}
            className="bg-focus-cyan text-[#0B0F14] px-6 py-3 rounded-xl font-display font-black uppercase tracking-wider">
            Back to Feynman Hub
          </button>
        </div>
      </div>
    );
  }

  // --- Computed values ---
  const currentQ = (session.currentQuestionIndex || 0) + 1;
  const totalQ = session.totalQuestions || 0;
  const currentScore = session.score || 0;
  const isComplete = session.status === 'COMPLETED' || result?.isComplete;
  const percentage = totalQ > 0 ? Math.round((currentScore / totalQ) * 100) : 0;

  // Helper: extract question text from AI message
  const getQuestionFromMessage = (msg) => {
    if (!msg) return '';
    // AI messages with questions have a "**Question X/Y:**" pattern
    const qMatch = msg.match(/\*\*Question \d+\/\d+:\*\*\s*([\s\S]*)/);
    if (qMatch) return qMatch[1].trim();
    // Fallback: remove everything before the question
    const lines = msg.split('\n');
    const qLine = lines.find(l => l.includes('Question') && (l.includes('/') || l.includes('?')));
    return qLine || msg;
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col">
      {/* Header */}
      <header className="bg-[#131A22] border-b border-[#1F2937] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/feynman')}
              className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-display font-bold text-white uppercase tracking-tight text-sm">{session.topic}</h1>
              <p className="text-xs text-slate-500">{isComplete ? 'Completed' : `Question ${currentQ}/${totalQ}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Score badge */}
            {totalQ > 0 && (
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                isComplete
                  ? percentage >= 70 ? 'bg-xp-green/10 text-xp-green border-xp-green/30'
                  : percentage >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-streak-pink/10 text-streak-pink border-streak-pink/30'
                  : 'bg-focus-cyan/10 text-focus-cyan border-focus-cyan/30'
              }`}>
                {isComplete ? `${currentScore}/${totalQ}` : `✅ ${currentScore}`}
              </span>
            )}
            {/* Status badge */}
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              isComplete ? 'bg-xp-green/10 text-xp-green' : session.status === 'ABANDONED' ? 'bg-slate-500/10 text-slate-500' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {isComplete ? 'Completed' : session.status === 'ABANDONED' ? 'Abandoned' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {totalQ > 0 && !isComplete && (
          <div className="max-w-4xl mx-auto mt-2">
            <div className="w-full bg-[#1F2937] rounded-full h-1.5">
              <div
                className="bg-focus-cyan h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentQ - 1) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Answer feedback banner */}
      {answerFeedback && !result && (
        <div className={`px-4 py-3 ${answerFeedback.isCorrect ? 'bg-xp-green/10 border-b border-xp-green/30' : 'bg-streak-pink/10 border-b border-streak-pink/30'}`}>
          <div className="max-w-3xl mx-auto">
            <div className={`rounded-xl p-4 ${answerFeedback.isCorrect ? 'bg-xp-green/5 border border-xp-green/20' : 'bg-streak-pink/5 border border-streak-pink/20'}`}>
              <p className={`font-semibold text-sm mb-1 ${answerFeedback.isCorrect ? 'text-xp-green' : 'text-streak-pink'}`}>
                {answerFeedback.isCorrect ? '✅ Correct!' : '❌ Not quite'}
              </p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{answerFeedback.feedback}</p>
              {!answerFeedback.isCorrect && answerFeedback.explanation && (
                <p className="text-slate-400 text-xs mt-2 italic whitespace-pre-wrap">{answerFeedback.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {(!session.exchanges || session.exchanges.length === 0) ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-focus-cyan/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-focus-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-400">Loading questions...</p>
            </div>
          ) : (
            session.exchanges.map((exchange, index) => {
              const isStudent = exchange.role === 'student';
              const isFirstAi = !isStudent && index === 0;
              const msgClass = isStudent ? 'justify-end' : 'justify-start';
              const bubbleClass = isStudent
                ? 'bg-focus-cyan/10 border border-focus-cyan/30 text-white'
                : 'bg-[#1F2937] border border-[#2A3A4A] text-slate-200';
              const sender = isStudent ? 'You' : 'AI Tutor';

              return (
                <div key={exchange.id || index} className={`flex gap-3 ${msgClass}`}>
                  {!isStudent && (
                    <div className="w-8 h-8 rounded-full bg-combo-purple/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-combo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{exchange.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1.5">{sender}</p>
                  </div>
                  {isStudent && (
                    <div className="w-8 h-8 rounded-full bg-focus-cyan/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-focus-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Completion result panel */}
      {result && (
        <div className="bg-[#131A22] border-t border-xp-green/30 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#1F2937] to-[#131A22] rounded-2xl p-6 border border-xp-green/30">
              {/* Score circle */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-xp-green/20 to-focus-cyan/20 flex items-center justify-center mx-auto mb-4 border-2 border-xp-green/40">
                  <div className="text-center">
                    <span className="text-3xl font-black text-xp-green">{result.score}</span>
                    <span className="text-lg text-slate-400">/{result.totalQuestions}</span>
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {result.percentage >= 80 ? '🌟 Nailed It!' :
                   result.percentage >= 60 ? '👍 Solid Understanding' :
                   result.percentage >= 40 ? '📚 Getting There' :
                   '💪 Keep Studying'}
                </h2>
                <p className="text-slate-400">
                  {result.percentage >= 80 ? 'You really know your stuff! The AI is impressed.' :
                   result.percentage >= 60 ? 'Good grasp of the topic! A few areas to polish.' :
                   result.percentage >= 40 ? 'You have the basics. Review the weak spots below.' :
                   'This topic needs more study. Check the corrections below.'}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#0B0F14] rounded-xl p-3 text-center border border-[#1F2937]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Score</p>
                  <p className="text-lg font-bold text-white">{result.percentage}%</p>
                </div>
                <div className="bg-[#0B0F14] rounded-xl p-3 text-center border border-[#1F2937]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Correct</p>
                  <p className="text-lg font-bold text-xp-green">{result.score}/{result.totalQuestions}</p>
                </div>
                <div className="bg-[#0B0F14] rounded-xl p-3 text-center border border-[#1F2937]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">XP Earned</p>
                  <p className="text-lg font-bold text-combo-purple">+{result.xpEarned}</p>
                </div>
              </div>

              {/* Wrong answers review */}
              {session.weakSpots && session.weakSpots.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-streak-pink font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Areas to Review ({session.weakSpots.length})
                  </p>
                  <div className="space-y-2">
                    {session.weakSpots.map((spot, i) => (
                      <div key={spot.id || i} className="bg-streak-pink/5 rounded-xl p-3 border border-streak-pink/20">
                        <p className="text-slate-300 text-sm">{spot.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-center">
                <button onClick={() => router.push('/feynman')}
                  className="bg-focus-cyan text-[#0B0F14] px-6 py-2.5 rounded-xl font-display font-black uppercase tracking-wider text-sm hover:shadow-focus-cyan transition-all">
                  Back to Hub
                </button>
                <button onClick={() => router.push('/quiz')}
                  className="bg-xp-green text-[#0B0F14] px-6 py-2.5 rounded-xl font-display font-black uppercase tracking-wider text-sm hover:shadow-xp-green transition-all">
                  Practice Weak Spots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {sendError && (
        <div className="bg-[#131A22] border-t border-streak-pink/30 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-streak-pink text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {sendError}
            </p>
          </div>
        </div>
      )}

      {/* Input area - only show if session is in progress */}
      {!isComplete && session.status === 'IN_PROGRESS' && (
        <div className="bg-[#131A22] border-t border-[#1F2937] px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setSendError(''); setAnswerFeedback(null); }}
                onKeyDown={handleKeyDown}
                placeholder={`Answer Question ${currentQ}/${totalQ}... Explain it simply!`}
                className="flex-1 bg-[#0B0F14] border-2 border-[#1F2937] rounded-xl px-4 py-3 text-slate-300 placeholder-slate-500 focus:border-focus-cyan focus:shadow-focus-cyan focus:outline-none resize-none transition-all"
                rows={2}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="bg-focus-cyan text-[#0B0F14] px-5 rounded-xl font-display font-black uppercase tracking-wider text-sm hover:shadow-focus-cyan disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
              >
                {sending ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
                Answer
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line.</p>
          </div>
        </div>
      )}

      {/* Completed state - show "View Results" instead of input */}
      {isComplete && !result && (
        <div className="bg-[#131A22] border-t border-xp-green/30 px-4 py-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xp-green font-semibold mb-2">✅ Session Complete!</p>
            <button onClick={() => { fetchSession(); }}
              className="bg-focus-cyan text-[#0B0F14] px-6 py-2.5 rounded-xl font-display font-black uppercase tracking-wider text-sm">
              View Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
