"use client";

/**
 * Skeleton — A reusable skeleton loader component built with Tailwind's animate-pulse.
 * 
 * Usage examples:
 * 
 *   // Simple text line
 *   <Skeleton className="h-4 w-3/4" />
 * 
 *   // Avatar + text block
 *   <div className="flex items-center gap-3">
 *     <Skeleton className="h-10 w-10 rounded-full" />
 *     <div className="space-y-2 flex-1">
 *       <Skeleton className="h-4 w-1/2" />
 *       <Skeleton className="h-3 w-1/4" />
 *     </div>
 *   </div>
 * 
 *   // Card skeleton
 *   <div className="rounded-xl border p-4 space-y-4">
 *     <Skeleton className="h-48 w-full rounded-lg" />
 *     <Skeleton className="h-4 w-3/4" />
 *     <Skeleton className="h-3 w-1/2" />
 *   </div>
 */

export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-[color:var(--surface)] ${className}`}
      {...props}
    />
  );
}

/**
 * DashboardCardSkeleton — A full card skeleton matching your dashboard card styles.
 * Drop this in place of your real card while data is loading.
 */
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 space-y-4">
      {/* Header line */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      {/* Title */}
      <Skeleton className="h-6 w-48" />
      {/* Body lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {/* Stat boxes */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * QuestListSkeleton — Matches the quest list items in the dashboard.
 */
export function QuestListSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Quest items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * PomodoroSkeleton — Matches the pomodoro timer layout.
 */
export function PomodoroSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 w-24 rounded-lg" />
      </div>
    </div>
  );
}

