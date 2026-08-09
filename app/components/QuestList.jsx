"use client";

import { useMemo, useState } from "react";
import PropTypes from "prop-types";

const DIFFICULTY_META = {
  Easy:   { label: "Easy",   accent: "var(--accent-info)",    xp: 10 },
  Medium: { label: "Medium", accent: "var(--accent-primary)", xp: 20 },
  Boss:   { label: "? Boss", accent: "var(--accent-alert)",   xp: 50 },
};

const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Boss"]);

// Fallback: infer difficulty from keywords in the title when DB value is absent
function inferDifficulty(title) {
  const lower = title.toLowerCase();
  if (lower.includes("boss") || lower.includes("exam") || lower.includes("final")) return "Boss";
  if (lower.includes("quiz") || lower.includes("practice") || lower.includes("review")) return "Medium";
  return "Easy";
}

export default function QuestList({ todos = [], onCompleteQuest }) {
  const [xpPop, setXpPop] = useState(null);

  const quests = useMemo(
    () =>
      todos.map((todo) => ({
        ...todo,
        difficulty: VALID_DIFFICULTIES.has(todo.difficulty) ? todo.difficulty : inferDifficulty(todo.title),
      })),
    [todos]
  );

  async function completeQuest(taskId, difficulty) {
    if (!onCompleteQuest) return;
    const result = await onCompleteQuest(taskId, difficulty);
    if (result && result.xpGained) {
      setXpPop(taskId);
      window.setTimeout(() => setXpPop(null), 1200);
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-primary)]">Today&apos;s Quests</p>
          <h3 className="mt-2 text-xl font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
            Study missions
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-[#0B0F14] px-3 py-1 text-sm text-slate-300">
          {quests.filter((task) => !task.completed).length} active
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {quests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0F14]/70 p-6 text-sm text-slate-400">
            No quests yet. Add one from the task board and it will appear here.
          </div>
        ) : (
          quests.map((task) => {
            const diff = DIFFICULTY_META[task.difficulty] ?? DIFFICULTY_META.Easy;
            return (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${task.completed ? "text-slate-500 line-through" : "text-white"}`}>
                    {task.title}
                  </p>
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white"
                    style={{ backgroundColor: diff.accent }}
                  >
                    {diff.label} · +{diff.xp} XP
                  </span>
                </div>
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => completeQuest(task.id, task.difficulty)}
                    disabled={task.completed}
                    className="rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-[color:var(--accent-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {task.completed ? "Completed" : "Complete"}
                  </button>
                  {xpPop === task.id ? (
                    <span className="animate-float-xp absolute -top-1 right-0 text-sm font-black text-[color:var(--accent-primary)]">
                      +{diff.xp} XP
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

QuestList.propTypes = {
  todos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      difficulty: PropTypes.string,
      completed: PropTypes.bool,
    })
  ),
  onCompleteQuest: PropTypes.func,
};
