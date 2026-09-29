"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1200, className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  return <span className={className}>{count.toLocaleString()}</span>;
}
