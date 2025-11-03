"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; name: string; url: string; type?: string; region?: string; order: number };

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const st = await fetch("/api/auth");
        const js = await st.json();
        setIsAdmin(!!js?.isAdmin);
        if (js?.isAdmin) {
          const res = await fetch("/api/bookmarks", { cache: "no-store" });
          const data = await res.json();
          if (Array.isArray(data)) setRows(data);
        }
      } catch {}
    })();
  }, []);

  async function login(e: React.FormEvent) {
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
        setIsAdmin(true);
        const r = await fetch("/api/bookmarks", { cache: "no-store" });
        const d = await r.json();
        setRows(d);
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveRow(r: Row) {
    await fetch("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, name: r.name, url: r.url, type: r.type, region: r.region }),
    });
  }

  async function deleteRow(id: string) {
    const url = `/api/bookmarks?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) setRows((prev) => prev.filter((x) => x.id !== id));
  }

  async function applyOrder() {
    const ids = rows
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((r) => r.id);
    await fetch("/api/bookmarks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  if (isAdmin === null) {
    return <div className="min-h-dvh bg-black text-white flex items-center justify-center">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-dvh bg-black text-white">
        <main className="mx-auto max-w-md px-6 py-20">
          <h1 className="mb-6 text-2xl font-semibold">Dashboard Login</h1>
          <form onSubmit={login} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <input className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
            <button disabled={loading} className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white">{loading ? "Signing in…" : "Sign in"}</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Bookmarks</h1>
          <button
            onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); router.replace("/"); }}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">URL</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Region</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className="odd:bg-white/0 even:bg-white/[0.03]">
                  <td className="px-3 py-2">
                    <input type="number" className="w-20 rounded-lg bg-black/40 px-2 py-1 border border-white/10" value={r.order} onChange={(e) => {
                      const v = parseInt(e.target.value || "0", 10);
                      setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, order: v } : x));
                    }} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-48 rounded-lg bg-black/40 px-2 py-1 border border-white/10" value={r.name} onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, name: e.target.value } : x))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-72 rounded-lg bg-black/40 px-2 py-1 border border-white/10" value={r.url} onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, url: e.target.value } : x))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-28 rounded-lg bg-black/40 px-2 py-1 border border-white/10" value={r.type || ""} onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, type: e.target.value } : x))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-20 rounded-lg bg-black/40 px-2 py-1 border border-white/10" value={r.region || ""} onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, region: e.target.value } : x))} />
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10" onClick={() => saveRow(r)}>Save</button>
                    <button className="rounded-lg border border-red-400/20 px-3 py-1 text-red-300 hover:bg-red-500/10" onClick={() => deleteRow(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10" onClick={applyOrder}>Apply Order</button>
        </div>
      </main>
    </div>
  );
}


