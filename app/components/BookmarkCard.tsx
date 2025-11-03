"use client";

import { memo, useMemo, useState } from "react";

export type Bookmark = {
  name: string;
  url: string;
  type?: string;
  region?: string;
};

function extractDomain(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    return u.hostname;
  } catch {
    return inputUrl.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function BookmarkCardBase({
  bookmark,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  bookmark: Bookmark;
  onRemove?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const domain = useMemo(() => extractDomain(bookmark.url), [bookmark.url]);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const [iconError, setIconError] = useState(false);
  const noiseDataUrl = useMemo(() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.5" /></svg>';
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  return (
    <div
      className="group relative rounded-[28px] p-[2.5px] transition-transform duration-200 hover:-translate-y-1"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-fuchsia-500/35 via-cyan-400/30 to-violet-500/35 blur-[26px] opacity-45 group-hover:opacity-65 transition-opacity" />
      <div className="relative rounded-[28px] bg-white/[0.06] backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Subtle gradient border overlay for glass rim */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px]" style={{
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)",
          mixBlendMode: "screen",
          opacity: 0.55
        }} />
        {/* Liquid glass inner highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-45" style={{
          background: "radial-gradient(120% 80% at 8% -14%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.10) 34%, transparent 60%)"
        }} />
        {/* Subtle specular streak */}
        <div className="pointer-events-none absolute -top-8 left-8 right-8 h-10 rounded-full opacity-35 rotate-[2deg]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)"
          }}
        />
        {/* Noise for texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url('${noiseDataUrl}')`
        }} />
        <a
          className="flex items-center gap-5 p-6 min-h-[92px]"
          href={bookmark.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/25 bg-white/95 flex items-center justify-center">
            {iconError ? (
              <span className="text-base font-semibold text-black/70">
                {bookmark.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <img
                src={faviconUrl}
                alt={`${bookmark.name} icon`}
                className="h-full w-full object-cover"
                onError={() => setIconError(true)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white truncate">
              {bookmark.name}
            </div>
            <div className="text-[14px] text-white/65 truncate">{domain}</div>
            {bookmark.type && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[11px] text-white/70">
                {bookmark.type}
                {bookmark.region && <span className="opacity-60">· {bookmark.region}</span>}
              </div>
            )}
          </div>
        </a>
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute right-3 top-3 rounded-full bg-white/10 text-white/75 hover:text-white hover:bg-white/20 transition-colors p-2"
            aria-label="Remove bookmark"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.1l-1.13 12.43A3 3 0 0 1 14.78 23H9.22a3 3 0 0 1-2.99-2.57L5.1 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm2 4a1 1 0 0 0-1 1v10a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm4 1a1 1 0 0 0-2 0v10a1 1 0 1 0 2 0V8Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export const BookmarkCard = memo(BookmarkCardBase);


