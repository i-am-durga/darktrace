"use client";

import { useEffect, useRef } from "react";

export function DataStreamBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Subtle moving cyber streams
    const streams = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 0.7 + 0.3,
      opacity: Math.random() * 0.04 + 0.02,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render streaming data vectors
      for (const s of streams) {
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.length);
        gradient.addColorStop(0, "rgba(0, 232, 138, 0)");
        gradient.addColorStop(1, `rgba(0, 232, 138, ${s.opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.length);
        ctx.stroke();

        // Lead particle
        ctx.fillStyle = `rgba(0, 232, 138, ${s.opacity * 1.8})`;
        ctx.fillRect(s.x - 0.5, s.y + s.length - 1, 2, 2);

        s.y += s.speed;
        if (s.y > height) {
          s.y = -s.length;
          s.x = Math.random() * width;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="data-stream-canvas"
      aria-hidden="true"
    />
  );
}
