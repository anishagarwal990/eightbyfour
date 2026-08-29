"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Long dwell on purpose. Slide two carries a headline, a paragraph, an input
// card and a six-line example quote — five seconds isn't enough to read it,
// let alone act on it. Fifteen also lets the material tiles inside slide one
// run roughly three of their own five-second crossfades before the slide
// changes underneath them.
const AUTO_ADVANCE_MS = 15000;

/**
 * The hero as two slides: the proposition, then the mechanic.
 *
 * Two movement modes, picked off the pointer type:
 *
 * - Coarse pointer (touch): the track is a native scroll-snap container, so a
 *   swipe works with no gesture handling. JS only nudges the scroll position on
 *   the timer and reads it back to light the right dot.
 * - Fine pointer (mouse/trackpad): the track is NOT a scroll container at all;
 *   it is translated by whole viewport widths. A horizontal scroller under the
 *   cursor is a scroll trap — Chrome maps a vertical wheel onto the only axis
 *   such an element can scroll, so scrolling the page flicked the hero sideways.
 *   The previous fix cancelled the wheel and re-applied it with window.scrollBy,
 *   which replaced the browser's own wheel animation and trackpad momentum with
 *   instant jumps, and that was the visible scroll stutter over the hero. With no
 *   scroller here there is nothing to trap the wheel and nothing to hand back.
 *
 * Auto-advance is deliberately fragile in the user's favour: it stops for good
 * the first time anyone touches the slider, focuses anything inside it, or
 * picks a slide. Slide two holds a form, and a carousel that slides a
 * half-typed requirement out from under someone is worse than no carousel.
 * It never starts under prefers-reduced-motion.
 *
 * It does NOT pause on hover, which is the usual reflex. This is a full-bleed
 * hero at the top of the page, so on desktop the pointer is resting over it
 * essentially all the time — pausing on hover means it never advances at all.
 * Nor does a wheel event count as engagement: scrolling the page vertically
 * happens over the hero constantly and says nothing about the slider.
 */
export function HeroCarousel({ slides, labels }: { slides: React.ReactNode[]; labels: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The track is a flex row, so its natural height is the tallest slide — on a
  // phone that left the short slide sitting above ~700px of dead space. The
  // height follows the active slide instead, measured rather than guessed
  // because slide two's height depends on how many lines the visitor has typed.
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  // Once true, never goes back — the visitor has taken control.
  const [userEngaged, setUserEngaged] = useState(false);
  // Only a coarse pointer gets the native horizontal scroller (see the note
  // above). Resolved after mount, so the server-rendered markup is the
  // transform variant — which needs no JS to sit correctly on slide one.
  const [swipeable, setSwipeable] = useState(false);
  const swipeableRef = useRef(false);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    function sync() {
      swipeableRef.current = mq.matches;
      setSwipeable(mq.matches);
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Entering scroller mode after the fact (a hybrid device reporting coarse
  // late) would otherwise land on slide one while the dots say otherwise.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !swipeable) return;
    track.scrollLeft = track.clientWidth * indexRef.current;
  }, [swipeable]);

  const goTo = useCallback((next: number, smooth = true) => {
    setIndex(next);
    const track = trackRef.current;
    // Transform mode: the index alone places the track, nothing to scroll.
    if (!track || !swipeableRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = track.clientWidth * next;
    const from = track.scrollLeft;
    track.scrollTo({ left, behavior: smooth && !reduce ? "smooth" : "auto" });

    // Some environments accept `behavior: "smooth"` and then do nothing —
    // embedded webviews in particular, where it is a silent no-op and
    // prefers-reduced-motion still reports false, so there is nothing to
    // feature-detect against. Left unchecked the carousel never moves.
    //
    // The check is "did it move at all", not "did it arrive". A real smooth
    // scroll is still mid-flight at this point, and forcing the position then
    // yanks it — or worse, snaps it out from under a thumb that has started
    // swiping, leaving the track parked between two slides.
    window.setTimeout(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft === from && from !== left) el.scrollLeft = left;
    }, 400);
  }, []);

  // Read the index back off the scroll position rather than tracking it
  // separately, so a manual swipe and a timed advance stay in agreement.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !swipeable) return;
    function onScroll() {
      if (!track) return;
      setIndex(Math.round(track.scrollLeft / track.clientWidth));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [swipeable]);

  useEffect(() => {
    const active = slideRefs.current[index];
    if (!active) return;
    function measure() {
      const el = slideRefs.current[index];
      if (el) setTrackHeight(el.offsetHeight);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(active);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [index]);

  useEffect(() => {
    if (userEngaged) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      // From the ref, not from scrollLeft: in transform mode the track never
      // scrolls, so reading the position back would peg "next" at slide two
      // forever and the carousel would stop after one advance.
      goTo((indexRef.current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [goTo, slides.length, userEngaged]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    setUserEngaged(true);
    goTo(Math.min(slides.length - 1, Math.max(0, index + (e.key === "ArrowRight" ? 1 : -1))));
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="What EightxFour does"
      onPointerDown={() => setUserEngaged(true)}
      onFocusCapture={() => setUserEngaged(true)}
      onKeyDown={handleKeyDown}
      // clip, not hidden: hidden would make this a scroll container of its own
      // and put the wheel trap straight back.
      className={swipeable ? undefined : "overflow-x-clip"}
    >
      <div
        ref={trackRef}
        className={`hero-track items-start ${swipeable ? "" : "hero-track--static"}`}
        style={{
          height: trackHeight,
          transform: swipeable ? undefined : `translateX(-${index * 100}%)`,
        }}
        tabIndex={-1}
      >
        {slides.map((slide, i) => (
          <div
            key={labels[i]}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${labels[i]} — ${i + 1} of ${slides.length}`}
            // Hidden slides stay in the DOM for crawlers and for the snap
            // container to measure, but are taken out of the tab order so a
            // keyboard user can't tab into an off-screen form.
            inert={i !== index}
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pb-8 pt-6">
        {slides.map((_, i) => (
          <button
            key={labels[i]}
            type="button"
            aria-label={`Show ${labels[i]}`}
            aria-current={i === index}
            onClick={() => {
              setUserEngaged(true);
              goTo(i);
            }}
            className="group flex h-6 items-center px-1"
          >
            <span
              aria-hidden="true"
              className="block h-[3px] transition-[width,background-color] duration-300 [transition-timing-function:var(--ease-out-soft)]"
              style={{
                width: i === index ? 28 : 14,
                background: i === index ? "var(--burgundy)" : "var(--line)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
