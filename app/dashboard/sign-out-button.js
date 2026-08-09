"use client";
import { signOut } from "next-auth/react";
export default function SignOutButton() { return <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign out</button>; }
