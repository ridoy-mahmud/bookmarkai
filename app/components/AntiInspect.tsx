"use client";

import { useEffect } from "react";

export function AntiInspect() {
  useEffect(() => {
    let enabled = true;
    (async () => {
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        const js = await res.json();
        if (js?.isAdmin) enabled = false;
      } catch {}

      if (!enabled) return;

      const onContext = (e: MouseEvent) => e.preventDefault();
      const onKey = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        const ctrl = e.ctrlKey || (e as any).metaKey;
        if (
          k === "f12" ||
          (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) ||
          (ctrl && k === "u")
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false as any;
        }
      };
      window.addEventListener("contextmenu", onContext, { capture: true });
      window.addEventListener("keydown", onKey, { capture: true });
      return () => {
        window.removeEventListener("contextmenu", onContext, { capture: true } as any);
        window.removeEventListener("keydown", onKey, { capture: true } as any);
      };
    })();
  }, []);

  return null;
}


