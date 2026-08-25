"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import type { Testimonial } from "@/lib/data/testimonials";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= rating ? "var(--accent)" : "var(--line)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className={cardClasses("p-5")} style={CARD_BASE_STYLE}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
          style={{ background: "var(--burgundy)", color: "#fff" }}
          aria-hidden="true"
        >
          {initials(t.name)}
        </div>
        <div>
          <p className="text-sm font-medium">{t.name}</p>
          {t.role ? (
            <p className="text-xs" style={{ color: "var(--line-strong)" }}>
              {t.role}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 text-sm">
        <Stars rating={t.rating} />
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
        {t.comment}
      </p>
      <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
        {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

export function Testimonials({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const supabase = createBrowserSupabaseClient();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();
    if (!trimmedName || !trimmedComment || rating < 1) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("testimonials").insert({
        name: trimmedName,
        role: role.trim() || null,
        comment: trimmedComment,
        rating,
        status: "approved",
      });
      if (error) {
        setStatus("Couldn't post your testimonial. Please try again.");
        return;
      }
      setTestimonials((prev) => [
        { name: trimmedName, role: role.trim() || null, comment: trimmedComment, rating, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setName("");
      setRole("");
      setRating(0);
      setComment("");
      setShowForm(false);
      setStatus("Thanks — your testimonial is live.");
      setTimeout(() => setStatus(null), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {testimonials.length === 0 ? "Early Days" : "What Our Customers Say"}
          </p>
          <h2 className="font-display mt-1" style={{ fontSize: "var(--fs-h2)" }}>
            {testimonials.length === 0 ? "Be Among Our First Reviews" : "Trusted by Homeowners, Designers & Contractors"}
          </h2>
          {testimonials.length === 0 ? (
            <p className="mt-2 max-w-md text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              We&apos;re early — this page doesn&apos;t have reviews yet. If you&apos;ve sourced through EightxFour, tell the
              next homeowner or contractor what that was actually like.
            </p>
          ) : null}
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Leave a testimonial"}
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mb-10 flex flex-col gap-3 rounded-sm border p-5"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="rounded-sm border px-3 py-2 text-sm"
              style={{ borderColor: "var(--line)" }}
            />
            <input
              placeholder="Role, e.g. Interior Designer (optional)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={80}
              className="rounded-sm border px-3 py-2 text-sm"
              style={{ borderColor: "var(--line)" }}
            />
          </div>

          <div>
            <label className="text-xs tracked-caps">Your rating</label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className="text-xl leading-none"
                  style={{ color: n <= rating ? "var(--accent)" : "var(--line)" }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Share your experience working with EightxFour…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            className="rounded-sm border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)" }}
          />

          <p className="text-xs" style={{ color: "var(--line-strong)" }}>
            Your testimonial posts publicly right away — no review queue, just like a LinkedIn recommendation.
          </p>

          <Button type="submit" variant="primary" className="self-start" disabled={submitting || !name.trim() || !comment.trim() || rating < 1}>
            {submitting ? "Posting…" : "Post testimonial"}
          </Button>
        </form>
      ) : null}

      {status ? (
        <p className="mb-6 text-sm" style={{ color: "var(--accent)" }}>
          {status}
        </p>
      ) : null}

      {testimonials.length === 0 ? null : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={`${t.name}-${t.created_at}-${i}`} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
