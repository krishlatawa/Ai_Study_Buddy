import Link from "next/link";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-combo-purple/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-focus-cyan/10 blur-[100px]" />

      {/* Badge / Upper Label */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-xp-green animate-pulse" />
        <p className="font-display text-sm font-bold tracking-[0.2em] text-combo-purple uppercase text-glow-purple">
          System Online // AI Study Buddy v1.0
        </p>
      </div>

      {/* Main Headline */}
      <h1 className="font-display max-w-3xl text-5xl font-extrabold uppercase tracking-tight text-white sm:text-7xl leading-[0.95]">
        Build better <br />
        <span className="text-xp-green text-glow-green">study habits</span>, <br />
        one focused <span className="text-focus-cyan text-glow-cyan">quest</span> at a time.
      </h1>

      {/* Sub-headline */}
      <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
        Stop filling out forms. Start leveling up. Reframe your tasks as quests, fight exams like bosses, and climb the scoreboard.
      </p>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-wrap gap-4">
        {/* Primary CTA (XP Green, Pill, Hover Glow, Scales Down) */}
        <Link 
          href="/signup" 
          className="group relative inline-flex items-center justify-center rounded-full bg-xp-green px-8 py-4 font-display text-lg font-black uppercase tracking-wider text-[#0B0F14] transition-all duration-150 hover:shadow-xp-green hover:scale-[1.03] active:scale-[0.97]"
        >
          Create Profile
        </Link>
        {/* Secondary CTA (Outline, Neon Border, Transparent Fill) */}
        <Link 
          href="/signin" 
          className="group inline-flex items-center justify-center rounded-full border-2 border-combo-purple bg-transparent px-8 py-4 font-display text-lg font-black uppercase tracking-wider text-combo-purple transition-all duration-150 hover:bg-combo-purple/10 hover:shadow-combo-purple active:scale-[0.97]"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
