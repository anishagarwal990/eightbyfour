"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Staggers direct children (uses .reveal-stagger) instead of animating this element as one block. */
  stagger?: boolean;
  as?: "div" | "section";
}

export function Reveal({ children, className, style, stagger, as = "div" }: RevealProps) {
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

  const base = stagger ? "reveal-stagger" : "reveal";
  const classes = [base, visible && "is-visible", className].filter(Boolean).join(" ");

  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<never>} className={classes} style={style}>
      {children}
    </Tag>
  );
}
