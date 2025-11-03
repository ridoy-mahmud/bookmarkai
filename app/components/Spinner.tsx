"use client";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-white">
      <div className="relative h-16 w-16">
        {/* outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-500 via-violet-500 to-cyan-400 blur-lg opacity-60" />
        {/* spinner arc */}
        <svg className="relative h-16 w-16 animate-spin-slow" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <path d="M44 24a20 20 0 0 0-20-20" stroke="url(#grad)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-sm text-white/80">{label}…</div>
      <style>{`
        .animate-spin-slow{animation:spin 1.2s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}


