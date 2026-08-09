"use client";

import { useEffect, useRef, useState } from "react";
import DashboardStatsHeader from "../components/DashboardStatsHeader";
import QuestList from "../components/QuestList";
import StreakSidebar from "../components/StreakSidebar";
import QuickLaunchGrid from "../components/QuickLaunchGrid";
import SignOutButton from "./sign-out-button";
import TodoList from "./todo-list";
import PomodoroTimer from "./pomodoro-timer";
import ThemeSwitcher from "../components/ThemeSwitcher";
import Link from 'next/link';


async function request(url, options) {
  const response = await fetch(url, options);
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "Something went wrong.");
  return data;
}

export default function DashboardShell({ initialProfile, userName }) {
  const [todos, setTodos] = useState([]);
  const [profile, setProfile] = useState(initialProfile);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [error, setError] = useState("");
  const [leveledUp, setLeveledUp] = useState(false);
  const prevLevelRef = useRef(initialProfile?.level ?? 1);

  useEffect(() => {
    async function loadData() {
      try {
        const [todoData, progressData] = await Promise.all([
          request("/api/todos"),
          request("/api/user/progress"),
        ]);
        setTodos(todoData.todos || []);
        setProfile(progressData.profile);
        prevLevelRef.current = progressData.profile?.level ?? 1;
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoadingTodos(false);
      }
    }

    loadData();
  }, []);

  // Detect level-up and auto-dismiss the celebration after 3 s
  function applyNewProfile(newProfile) {
    if (!newProfile) return;
    const oldLevel = prevLevelRef.current;
    const newLevel = newProfile.level ?? 1;
    if (newLevel > oldLevel) {
      setLeveledUp(true);
      window.setTimeout(() => setLeveledUp(false), 3000);
    }
    prevLevelRef.current = newLevel;
    setProfile(newProfile);
  }

  async function createTodo(title, difficulty) {
    const data = await request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, difficulty }),
    });
    setTodos((current) => [data.todo, ...current]);
    return data.todo;
  }

  async function updateTodo(id, changes) {
    const data = await request(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setTodos((current) => current.map((todo) => (todo.id === id ? data.todo : todo)));
    if (data.profile) {
      applyNewProfile(data.profile);
    }
    return { todo: data.todo, xpGained: !!data.profile };
  }

  async function deleteTodo(id) {
    await request(`/api/todos/${id}`, { method: "DELETE" });
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  async function completeQuest(taskId, difficulty) {
    const todo = todos.find((item) => item.id === taskId);
    if (!todo || todo.completed) return;

    try {
      const result = await updateTodo(taskId, { completed: true });
      return result;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    }
  }

  async function awardFocusBonus(focusMinutes) {
    try {
      const progressData = await request("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 25, source: "focus", focusMinutes }),
      });
      applyNewProfile(progressData.profile);
      return progressData;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    }
  }

  return (
    <main className="min-h-screen w-full bg-[color:var(--bg)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <nav className="flex flex-col gap-4 rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/80 p-4 shadow-[0_0_30px_rgba(0,0,0,0.25)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-info)]">AI Study Buddy</p>
            <h1 className="mt-1 text-xl font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
              Welcome back, {userName}.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <SignOutButton />
          </div>
        </nav>

        <section className="grid gap-6 xl:grid-cols-6">
          <div className="xl:col-span-6">
            <DashboardStatsHeader profile={profile} leveledUp={leveledUp} />
          </div>

          <div className="xl:col-span-4">
            <QuestList todos={todos} onCompleteQuest={completeQuest} />
          </div>
          <div className="xl:col-span-2">
            <StreakSidebar profile={profile} />
          </div>

          <div className="xl:col-span-6">
            <QuickLaunchGrid />
          </div>

          <div className="xl:col-span-3">
            <PomodoroTimer quests={todos.filter((todo) => !todo.completed)} onFocusComplete={awardFocusBonus} />
          </div>
          <div className="xl:col-span-3">
            <TodoList todos={todos} loading={loadingTodos} error={error} onCreateTodo={createTodo} onUpdateTodo={updateTodo} onDeleteTodo={deleteTodo} />
          </div>
        </section>
      </div>
    </main>
  );
}
