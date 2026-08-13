"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Staggers direct children (uses .reveal-stagger) instead of animating this element as one block. */
  stagger?: boolean;
  /** Bigger rise + scale, longer duration — for moments that should read as more deliberate than the default. */
  strong?: boolean;
  as?: "div" | "section";
}

export function Reveal({ children, className, style, stagger, strong, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = stagger ? (strong ? "reveal-stagger-strong" : "reveal-stagger") : strong ? "reveal-strong" : "reveal";
  const classes = [base, visible && "is-visible", className].filter(Boolean).join(" ");

  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<never>} className={classes} style={style}>
      {children}
    </Tag>
  );
}
