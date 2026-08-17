'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Skeleton from '../components/Skeleton';

export default function FeynmanHubPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastSessions, setPastSessions] = useState([]);
  const [weakSpots, setWeakSpots] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    fetch('/api/feynman/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent && data.success) setPastSessions(data.sessions);
      })
      .catch((err) => {
        console.error('Failed to fetch sessions:', err);
      })
      .finally(() => {
        if (isCurrent) setLoadingSessions(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetch('/api/feynman/weakspots')
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent && data.success) setWeakSpots(data.weakSpots);
      })
      .catch((err) => {
        console.error('Failed to fetch weak spots:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const startSession = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      setError('Please provide a topic (at least 3 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/feynman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), notes: notes.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start session');
      }

      router.push(`/feynman/${data.session.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">In Progress</span>;
      case 'COMPLETED': return <span className="text-xp-green text-xs font-bold uppercase tracking-wider">Completed</span>;
      case 'ABANDONED': return <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Abandoned</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] py-8 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-focus-cyan/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-combo-purple/10 blur-[100px]" />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-xp-green animate-pulse" />
            <p className="font-display text-sm font-bold tracking-[0.2em] text-focus-cyan uppercase text-glow-cyan">Feynman Technique v1.0</p>
          </div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl leading-[0.95]">Teach-Back <span className="text-combo-purple text-glow-purple">AI</span></h1>
          <p className="mt-2 text-lg text-slate-400">Explain concepts to a confused AI. If you can&apos;t explain it simply, you don&apos;t understand it yet.</p>
        </div>

        <div className="bg-[#131A22] rounded-2xl p-6 border border-[#1F2937] mb-8 shadow-lg">
          <label className="block text-sm font-medium text-slate-300 mb-2 font-display uppercase tracking-wider">What topic do you want to explain?</label>
          <input type="text" value={topic} onChange={(e) => { setTopic(e.target.value); setError(''); }} placeholder="e.g., Photosynthesis, Quantum Computing, The Water Cycle..." className="w-full p-4 bg-[#0B0F14] border-2 border-[#1F2937] rounded-xl focus:border-focus-cyan focus:shadow-focus-cyan focus:outline-none text-slate-300 placeholder-slate-500 transition-all mb-4" />
          <label className="block text-sm font-medium text-slate-300 mb-2 font-display uppercase tracking-wider">Your Notes (optional, for context)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste any study notes or key points about the topic to help the AI ask better questions..." className="w-full h-32 p-4 bg-[#0B0F14] border-2 border-[#1F2937] rounded-xl focus:border-focus-cyan focus:shadow-focus-cyan focus:outline-none resize-y text-slate-300 placeholder-slate-500 transition-all" />
          {error && <p className="text-streak-pink text-sm mt-2 flex items-center gap-1 font-semibold">{error}</p>}
          <button onClick={startSession} disabled={loading} className="w-full mt-4 bg-focus-cyan text-[#0B0F14] py-3.5 rounded-xl font-display font-black uppercase tracking-wider hover:shadow-focus-cyan hover:scale-[1.02] disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 transition-all flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting Session...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Teach-Back Session
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Past Sessions Column */}
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white mb-4">Past <span className="text-focus-cyan text-glow-cyan">Sessions</span></h2>
            <div className="bg-[#131A22] rounded-2xl border border-[#1F2937] p-4">
              {loadingSessions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#0B0F14] rounded-xl p-4 border border-[#1F2937]">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pastSessions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No sessions yet. Start your first Teach-Back session above!</p>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((s) => (
                    <div key={s.id} onClick={() => router.push(`/feynman/${s.id}`)} className="bg-[#0B0F14] rounded-xl p-4 border border-[#1F2937] hover:border-focus-cyan/50 cursor-pointer transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-bold text-white uppercase tracking-tight text-sm truncate group-hover:text-focus-cyan transition-colors">{s.topic}</h3>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''}</span>
                        <span>&bull;</span>
                        <span>{s.totalQuestions || s.exchanges?.length || 0} questions</span>
                        {s.xpEarned > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="text-xp-green">+{s.xpEarned} XP</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weak Spots Column */}
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white mb-4">Weak <span className="text-streak-pink text-glow-pink">Spots</span></h2>
            <div className="bg-[#131A22] rounded-2xl border border-[#1F2937] p-4">
              {weakSpots.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No weak spots identified yet. Complete a Teach-Back session and the AI will map out gaps in your understanding!</p>
              ) : (
                <div className="space-y-3">
                  {weakSpots.map((spot) => (
                    <div key={spot.id} className="bg-[#0B0F14] rounded-xl p-4 border border-[#1F2937]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-streak-pink" />
                        <span className="text-xs text-streak-pink font-bold uppercase tracking-wider">{spot.topic}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{spot.description}</p>
                      {spot.session && (
                        <button onClick={() => router.push(`/feynman/${spot.sessionId}`)} className="mt-2 text-xs text-focus-cyan hover:underline">View session &rarr;</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
