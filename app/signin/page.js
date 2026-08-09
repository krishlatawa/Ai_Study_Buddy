"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if(result?.error){
      setIsSubmitting(false);
      setError("Invalid Email or Password!");
      return;
    }

    window.location.href="/dashboard"
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12 overflow-x-hidden">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl bg-[#121820] p-8 shadow-2xl ring-1 ring-slate-800 border-l-4 border-combo-purple"
      >
        <Link href="/" className="font-display text-sm font-bold uppercase tracking-wider text-combo-purple hover:text-glow-purple">
          ← Back to Base
        </Link>
        
        <h1 className="font-display mt-6 text-4xl font-extrabold uppercase tracking-tight text-white">
          Lock In
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter credentials to load your study profile.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Email Address
            </label>
            <div className="relative mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="player@studybuddy.gg"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
                className="peer w-full min-h-[44px] rounded-lg bg-[#0B0F14] px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-combo-purple focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
              />
              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-combo-purple transition-transform duration-200 peer-focus:scale-x-100" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "password-error" : undefined}
                className="peer w-full min-h-[44px] rounded-lg bg-[#0B0F14] px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-combo-purple focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
              />
              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-combo-purple transition-transform duration-200 peer-focus:scale-x-100" />
            </div>
          </div>
        </div>

        {error && (
          <p id="form-error" className="mt-4 font-mono text-sm text-streak-pink text-glow-pink" role="alert" aria-live="assertive">
            ⚠️ {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          className="group mt-8 w-full min-h-[44px] relative flex items-center justify-center rounded-full bg-xp-green py-3.5 font-display text-sm font-black uppercase tracking-wider text-[#0B0F14] transition hover:shadow-xp-green hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-xp-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
        >
          {isSubmitting ? "Initialising..." : "Authenticate"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          First time?{" "}
          <Link href="/signup" className="font-bold text-xp-green hover:underline">
            Register Player Profile
          </Link>
        </p>
      </form>
    </main>
  );
}
