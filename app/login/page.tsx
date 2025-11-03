"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <div className="absolute inset-0 [background:radial-gradient(1200px_600px_at_50%_-10%,rgba(91,43,170,0.35),transparent)]" />
      <main className="relative mx-auto max-w-md px-6 py-24">
        <h1 className="mb-8 text-center text-3xl font-bold">Admin Login</h1>
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-4">
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm text-white/70">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="group relative inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-base font-semibold text-white transition focus:outline-none disabled:opacity-60"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 opacity-90 group-hover:opacity-100" />
            <span className="absolute inset-0 rounded-full blur-lg bg-gradient-to-r from-fuchsia-500/60 via-violet-500/60 to-cyan-400/60 opacity-40 group-hover:opacity-60" />
            <span className="relative">{loading ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>
      </main>
    </div>
  );
}


