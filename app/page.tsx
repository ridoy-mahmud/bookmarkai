"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkCard, type Bookmark } from "./components/BookmarkCard";
import { PixelBlast } from "./components/PixelBlast";
import { useRouter } from "next/navigation";
import { Spinner } from "./components/Spinner";

export default function Home() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<(Bookmark & { id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const CACHE_KEY = "ai-bookmark:cache:v2";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const dragIndexRef = useRef<number | null>(null);

  // Load from API (auto-seeds on server if empty)
  useEffect(() => {
    (async () => {
      // 1) Try local cache first for instant paint
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setBookmarks(parsed);
            setLoading(false);
          }
        }
      } catch {}

      // 2) Fetch fresh data in background and replace
      try {
        const res = await fetch("/api/bookmarks", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookmarks(data);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Persist any later changes to localStorage (e.g., reorder, add)
  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks]);

  // Ensure specific ordering and presence: Gemini at 2, Grok at 4, NotebookLM at 6
  const ensuredRef = useRef(false);
  useEffect(() => {
    (async () => {
      if (ensuredRef.current) return;
      if (bookmarks.length === 0) return;
      ensuredRef.current = true;
      // compute desired order once
      const lower = (s: string) => s.toLowerCase();
      const gemini = bookmarks.find((b) => lower(b.name).startsWith("gemini"));
      let grok = bookmarks.find((b) => lower(b.name).includes("grok"));
      let notebook = bookmarks.find((b) => lower(b.name).includes("notebooklm") || lower(b.name).includes("notebook llm"));

      // add if missing (grok.com, notebooklm.google)
      const toAdd: { name: string; url: string; type?: string }[] = [];
      if (!grok) toAdd.push({ name: "Grok", url: "https://grok.com", type: "chat" });
      if (!notebook) toAdd.push({ name: "NotebookLM", url: "https://notebooklm.google", type: "productivity" });
      if (toAdd.length) {
        for (const a of toAdd) {
          try {
            const res = await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
            const created = await res.json();
            if (created?.id) {
              if (a.name === "Grok") grok = created;
              if (a.name === "NotebookLM") notebook = created;
            }
          } catch {}
        }
        // reload list after additions
        try {
          const res = await fetch("/api/bookmarks", { cache: "no-store" });
          const data = await res.json();
          if (Array.isArray(data)) setBookmarks(data);
        } catch {}
      }

      if (!gemini) return; // need gemini to position

      const rest = bookmarks.filter((b) => b !== gemini && b !== grok && b !== notebook);
      const target: (typeof bookmarks[number])[] = [];
      const place = (idx1: number, item?: typeof bookmarks[number]) => {
        if (!item) return;
        while (target.length < idx1 - 1) {
          const next = rest.shift();
          if (!next) break;
          target.push(next);
        }
        target.push(item);
      };
      place(2, gemini);
      place(4, grok);
      place(6, notebook);
      target.push(...rest);
      if (target.every((b) => b?.id)) {
        try {
          await fetch("/api/bookmarks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: target.map((b) => b.id) }) });
          setBookmarks(target);
        } catch {}
      }
    })();
  }, [bookmarks]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let base = bookmarks;
    if (typeFilter !== "all") {
      base = base.filter((b) => (b.type || "").toLowerCase() === typeFilter);
    }
    if (regionFilter !== "all") {
      base = base.filter((b) => (b.region || "").toLowerCase() === regionFilter);
    }
    if (!q) return base;
    return base.filter((b) => `${b.name} ${b.url} ${b.type ?? ""}`.toLowerCase().includes(q));
  }, [bookmarks, debouncedQuery, typeFilter, regionFilter]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => b.type && set.add((b.type || "").toLowerCase()));
    return Array.from(set).sort();
  }, [bookmarks]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => b.region && set.add((b.region || "").toLowerCase()));
    return Array.from(set).sort();
  }, [bookmarks]);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    let normalizedUrl = url.trim();
    if (!trimmedName || !normalizedUrl) return;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    (async () => {
      try {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, url: normalizedUrl }),
        });
        const created = await res.json();
        if (created && created.id) {
          setBookmarks((prev) => [created, ...prev]);
          setName("");
          setUrl("");
        }
      } catch {}
    })();
  }

  function removeAt(index: number) {
    const id = bookmarks[index]?.id;
    if (!id) return setBookmarks((prev) => prev.filter((_, i) => i !== index));
    (async () => {
      try {
        // check auth first
        const st = await fetch("/api/auth");
        const js = await st.json();
        if (!js?.isAdmin) {
          router.push("/login");
          return;
        }
        const url = `/api/bookmarks?id=${encodeURIComponent(id)}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) setBookmarks((prev) => prev.filter((_, i) => i !== index));
      } catch {}
    })();
  }

  function onDragStart(index: number) {
    return (e: React.DragEvent) => {
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = "move";
    };
  }

  function onDragOver(index: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
  }

  function onDrop(index: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndexRef.current;
      dragIndexRef.current = null;
      if (from === null || from === index) return;
      setBookmarks((prev) => {
        const next = prev.slice();
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved);
        // sync order to server
        const ids = next.map((b) => b.id).filter(Boolean) as string[];
        (async () => {
          try {
            await fetch("/api/bookmarks", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids }),
            });
          } catch {}
        })();
        return next;
      });
    };
  }

  function reseedTop20() {
    // Simple reseed: delete all then reload by calling GET (which seeds if empty)
    (async () => {
      try {
        // Not implementing bulk delete endpoint; emulate by fetching current and deleting each
        const res = await fetch("/api/bookmarks", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          await Promise.all(
            data.map((b: any) => fetch(`/api/bookmarks?id=${encodeURIComponent(b.id)}`, { method: "DELETE" }))
          );
        }
        const res2 = await fetch("/api/bookmarks", { cache: "no-store" });
        const seeded = await res2.json();
        if (Array.isArray(seeded)) setBookmarks(seeded);
      } catch {}
    })();
  }

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <div className="absolute inset-0" style={{ width: "100%", height: "100%" }}>
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#5B2BAA"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-16">
        <header className="mb-6 flex flex-col items-center text-center" />


        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="appearance-none rounded-2xl border border-white/20 bg-black/60 px-4 pr-10 py-2 text-sm text-white/90 outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur focus:border-fuchsia-400/40 focus:shadow-[0_0_0_3px_rgba(217,70,239,0.15)]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/></svg>
            </div>
            <div className="relative">
              <select
                className="appearance-none rounded-2xl border border-white/20 bg-black/60 px-4 pr-10 py-2 text-sm text-white/90 outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="all">All regions</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/></svg>
            </div>
          </div>
          <div className="w-full sm:w-[280px]">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-violet-400/40"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {/* Section title similar to the reference UI */}
        <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/60">
          AI Tools
        </div>

        {loading ? (
          <Spinner label="Loading bookmarks" />
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/60">
            No bookmarks found. Try resetting to the top 20 or clearing your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b, i) => (
              <BookmarkCard
                key={`${b.url}-${i}`}
                bookmark={b}
                draggable
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                onDrop={onDrop(i)}
              />
            ))}
          </div>
        )}

        {/* Bottom Controls */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1 flex items-stretch">
            <a
              href="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white hover:bg-white/10 backdrop-blur"
            >
              Dashboard
            </a>
          </div>
          <form onSubmit={onAdd} className="col-span-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="col-span-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none placeholder:text-white/40 focus:border-cyan-400/40"
              placeholder="Name (e.g., Midjourney)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="col-span-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none placeholder:text-white/40 focus:border-fuchsia-400/40"
              placeholder="URL (e.g., midjourney.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="submit"
              className="col-span-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white hover:bg-white/10 backdrop-blur"
            >
              Add Bookmark
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
