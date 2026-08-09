"use client";

import { useState } from "react";
import Skeleton from "../components/Skeleton";

const DIFFICULTIES = ["Easy", "Medium", "Boss"];

const DIFFICULTY_STYLE = {
  Easy: { color: "var(--accent-info)", label: "Easy" },
  Medium: { color: "var(--accent-primary)", label: "Medium" },
  Boss: { color: "var(--accent-alert)", label: "Boss" },
};

export default function TodoList({ todos = [], loading = false, error = "", onCreateTodo, onUpdateTodo, onDeleteTodo }) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function createTodo(event) {
    event.preventDefault();
    if (!onCreateTodo || !title.trim()) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      await onCreateTodo(title, difficulty);
      setTitle("");
      setDifficulty("Easy");
    } catch (err) {
      setFormError(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateTodo(id, changes) {
    if (!onUpdateTodo) return;
    setFormError("");
    try {
      await onUpdateTodo(id, changes);
      setEditingId(null);
    } catch (err) {
      setFormError(err.message || "Failed to update task");
    }
  }

  async function deleteTodo(id) {
    if (!onDeleteTodo) return;
    setFormError("");
    try {
      await onDeleteTodo(id);
    } catch (err) {
      setFormError(err.message || "Failed to delete task");
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-[color:var(--accent-primary)]">MISSION QUEUE</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[color:var(--foreground)]">Today&apos;s tasks</h2>
        </div>
        <span className="rounded-full bg-[color:var(--bg)] px-3 py-1 font-mono text-xs text-[color:var(--foreground)]">
          {todos.filter((todo) => !todo.completed).length} active
        </span>
      </div>

      <form onSubmit={createTodo} className="mt-6 space-y-3">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (formError) setFormError("");
          }}
          maxLength="200"
          placeholder="Add a study mission..."
          disabled={isSubmitting}
          className="w-full rounded-lg border border-[color:var(--surface)] bg-[color:var(--bg)] px-4 py-3 text-sm text-[color:var(--foreground)] placeholder-[color:var(--foreground)]/60 outline-none focus:border-[color:var(--accent-primary)] disabled:opacity-50"
        />
        <div className="flex gap-2">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              type="button"
              disabled={isSubmitting}
              onClick={() => setDifficulty(diff)}
              className="flex-1 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] transition disabled:opacity-50"
              style={{
                borderColor: difficulty === diff ? DIFFICULTY_STYLE[diff].color : "rgba(255,255,255,0.08)",
                color: difficulty === diff ? DIFFICULTY_STYLE[diff].color : "rgba(255,255,255,0.4)",
                backgroundColor: difficulty === diff ? `${DIFFICULTY_STYLE[diff].color}18` : "transparent",
              }}
            >
              {diff === "Boss" ? "☠ Boss" : diff === "Medium" ? "⚔ Medium" : "🛡 Easy"}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="w-full rounded-lg bg-[color:var(--accent-primary)] px-4 py-3 font-display text-sm font-bold text-[color:var(--bg)] transition hover:shadow-xp-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding...
            </>
          ) : (
            "Add task"
          )}
        </button>
      </form>

      {formError || error ? <p className="mt-4 text-sm font-medium text-[color:var(--accent-alert)]">⚠ {formError || error}</p> : null}

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-[color:var(--surface)] bg-[color:var(--bg)] px-4 py-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      ) : todos.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[color:var(--surface)] px-4 py-8 text-center text-sm text-[color:var(--foreground)]/70">
          No tasks yet. Add your first study mission above.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {todos.map((todo) => {
            const diff = DIFFICULTY_STYLE[todo.difficulty] ?? DIFFICULTY_STYLE.Easy;
            return (
              <li key={todo.id} className="flex items-center gap-3 rounded-lg border border-[color:var(--surface)] bg-[color:var(--bg)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => updateTodo(todo.id, { completed: !todo.completed })}
                  className="h-4 w-4 accent-[color:var(--accent-primary)]"
                />
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: diff.color }}
                  title={diff.label}
                />
                {editingId === todo.id ? (
                  <form
                    onSubmit={(event) => { event.preventDefault(); updateTodo(todo.id, { title: editingTitle }); }}
                    className="flex min-w-0 flex-1 gap-2"
                  >
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      maxLength="200"
                      className="min-w-0 flex-1 rounded bg-[color:var(--surface)] px-2 py-1 text-sm text-[color:var(--foreground)] outline-none ring-1 ring-[color:var(--accent-primary)]"
                    />
                    <button className="text-xs font-bold text-[color:var(--accent-primary)]">Save</button>
                  </form>
                ) : (
                  <span className={`min-w-0 flex-1 text-sm ${todo.completed ? "text-[color:var(--foreground)]/50 line-through" : "text-[color:var(--foreground)]"}`}>
                    {todo.title}
                  </span>
                )}
                <button
                  onClick={() => { setEditingId(todo.id); setEditingTitle(todo.title); }}
                  className="text-xs font-bold text-[color:var(--accent-secondary)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-xs font-bold text-[color:var(--accent-alert)]"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
