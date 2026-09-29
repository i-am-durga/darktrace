"use client";

import { useEffect, useRef } from "react";

/**
 * MouseTracker — mounts once at the root layout level.
 * Writes --mx / --my (0-1 normalized) and --cx / --cy (px) to :root.
 * Also handles:
 *   • cursor glow blob
 *   • 3-D tilt on [data-tilt] elements
 *   • magnetic pull on [data-magnetic] elements
 */
export function MouseTracker() {
  const blobRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = document.documentElement;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      // normalized 0-1 for CSS gradient follows
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      root.style.setProperty("--mx", nx.toFixed(4));
      root.style.setProperty("--my", ny.toFixed(4));
      root.style.setProperty("--cx", `${e.clientX}px`);
      root.style.setProperty("--cy", `${e.clientY}px`);

      // 3-D tilt on closest ancestor [data-tilt]
      const tiltEl = (e.target as HTMLElement).closest("[data-tilt]") as HTMLElement | null;
      if (tiltEl) {
        const rect = tiltEl.getBoundingClientRect();
        const rx = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
        const ry = ((e.clientX - rect.left) / rect.width - 0.5) * -14;
        tiltEl.style.setProperty("--tilt-x", `${rx}deg`);
        tiltEl.style.setProperty("--tilt-y", `${ry}deg`);
      }

      // Magnetic pull on [data-magnetic] buttons
      const magEl = (e.target as HTMLElement).closest("[data-magnetic]") as HTMLElement | null;
      if (magEl) {
        const rect = magEl.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const dy = (e.clientY - rect.top - rect.height / 2) * 0.3;
        magEl.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    // Reset magnetic on leave
    const onLeave = (e: MouseEvent) => {
      const magEl = (e.target as HTMLElement).closest("[data-magnetic]") as HTMLElement | null;
      if (magEl) {
        magEl.style.transform = "";
      }
      const tiltEl = (e.target as HTMLElement).closest("[data-tilt]") as HTMLElement | null;
      if (tiltEl) {
        tiltEl.style.removeProperty("--tilt-x");
        tiltEl.style.removeProperty("--tilt-y");
      }
    };

    // Smooth cursor blob follow via rAF
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.08;
      pos.current.y += (target.current.y - pos.current.y) * 0.08;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true, capture: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      aria-hidden="true"
      className="cursor-glow"
    />
  );
}
