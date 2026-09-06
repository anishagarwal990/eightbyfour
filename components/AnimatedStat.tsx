"use client";

import NumberFlow from "@number-flow/react";
import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

// Counts up once, the first time the stat scrolls into view — same
// NumberFlow + Framer Motion technique as Skiper UI's AnimatedNumber_004,
// sized for an inline trust-stats strip rather than a full-screen hero.
export function AnimatedStat({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.6 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, motionValue]);

  return (
    <span ref={ref}>
      <NumberFlow value={displayValue} prefix={prefix} suffix={suffix} />
    </span>
  );
}
