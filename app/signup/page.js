"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });


    if (result?.error) {
      setIsSubmitting(false);
      return router.push("/signin");
    }

    window.location.href="/dashboard";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl bg-[#121820] p-8 shadow-2xl ring-1 ring-slate-800 border-l-4 border-xp-green"
      >
        <Link href="/" className="font-display text-sm font-bold uppercase tracking-wider text-xp-green hover:text-glow-green">
          ← Back to Base
        </Link>

        <h1 className="font-display mt-6 text-4xl font-extrabold uppercase tracking-tight text-white">
          Create Profile
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign up to unlock your esports-style study dashboard.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Player Name
            </label>
            <div className="relative mt-2">
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="StudyBuddy_User"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "form-error" : undefined}
                className="peer w-full min-h-[44px] rounded-lg bg-[#0B0F14] px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-xp-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
              />
              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-xp-green transition-transform duration-200 peer-focus:scale-x-100" />
            </div>
          </div>

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
                aria-describedby={error ? "form-error" : undefined}
                className="peer w-full min-h-[44px] rounded-lg bg-[#0B0F14] px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-xp-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
              />
              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-xp-green transition-transform duration-200 peer-focus:scale-x-100" />
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
                minLength="8"
                required
                placeholder="••••••••"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "form-error password-hint" : "password-hint"}
                className="peer w-full min-h-[44px] rounded-lg bg-[#0B0F14] px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-xp-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
              />
              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-xp-green transition-transform duration-200 peer-focus:scale-x-100" />
            </div>
            <span id="password-hint" className="mt-1.5 block text-xs font-medium text-slate-500">
              Must be at least 8 characters.
            </span>
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
          {isSubmitting ? "Registering..." : "Start Journey"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/signin" className="font-bold text-combo-purple hover:underline">
            Authenticate Profile
          </Link>
        </p>
      </form>
    </main>
  );
}
