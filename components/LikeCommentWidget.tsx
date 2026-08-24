"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getIdentity, setIdentity, hasLiked, markLiked } from "@/lib/identity";
import { isSaved, toggleSaved } from "@/lib/saved";
import { Button } from "@/components/ui/Button";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { SaveIcon } from "@/components/icons/SaveIcon";
import { UploadIcon } from "@/components/icons/UploadIcon";
import type { ProductRatingSummary } from "@/lib/data/reviews";

const PROFESSIONS = ["Architect", "Interior Designer", "Contractor", "Builder", "Homeowner", "Dealer", "Fabricator", "Other"];
const MAX_REVIEW_IMAGES = 3;

interface Comment {
  name: string;
  comment: string;
  rating: number | null;
  created_at: string;
  profession: string | null;
  image_urls: string[] | null;
}

export function LikeCommentWidget({
  productId,
  initialRatings,
}: {
  productId: number;
  initialRatings?: ProductRatingSummary;
}) {
  const supabase = createBrowserSupabaseClient();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(() => (typeof window !== "undefined" ? hasLiked(productId) : false));
  const [saved, setSaved] = useState(() => (typeof window !== "undefined" ? isSaved(productId) : false));
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(initialRatings ? initialRatings.reviews : null);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);
  const [profession, setProfession] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [pendingAction, setPendingAction] = useState<"like" | "comment" | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityPhone, setIdentityPhone] = useState("");
  const [commentStatus, setCommentStatus] = useState<string | null>(null);

  const rated = comments?.filter((c) => c.rating) ?? [];
  const ratedCount = rated.length;
  const averageRating = ratedCount > 0 ? rated.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCount : 0;

  useEffect(() => {
    supabase.rpc("get_like_counts").then(({ data }) => {
      const row = data?.find((r: { product_id: number; like_count: number }) => r.product_id === productId);
      if (row) setLikeCount(Number(row.like_count));
    });
    supabase
      .from("product_comments")
      .select("name, comment, rating, created_at, profession, image_urls")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => setComments(data || []));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doLike() {
    const identity = getIdentity();
    if (!identity) return;
    const { data, error } = await supabase.rpc("submit_like", {
      p_product_id: productId,
      p_name: identity.name,
      p_phone: identity.phone,
    });
    if (error) {
      alert(error.message || "Couldn't submit your like. Please try again.");
      return;
    }
    setLikeCount(Number(data.like_count));
    markLiked(productId);
    setLiked(true);
  }

  function doSave() {
    setSaved(toggleSaved(productId));
  }

  async function doShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");
    } catch {
      setShareStatus(url);
    }
    setTimeout(() => setShareStatus(null), 2500);
  }

  async function doComment() {
    const identity = getIdentity();
    const text = commentText.trim();
    if (!identity || !text || rating < 1) return;
    setSubmittingComment(true);
    try {
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        const uploads = await Promise.all(
          reviewImages.map(async (file, i) => {
            const path = `${productId}/${Date.now()}-${i}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from("review-media").upload(path, file);
            if (uploadError) return null;
            return supabase.storage.from("review-media").getPublicUrl(path).data.publicUrl;
          })
        );
        imageUrls = uploads.filter((u): u is string => Boolean(u));
      }

      const { error } = await supabase.from("product_comments").insert({
        product_id: productId,
        name: identity.name,
        phone: identity.phone,
        comment: text,
        rating,
        profession: profession || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      });
      if (error) {
        setCommentStatus("Couldn't post your comment. Please try again.");
        return;
      }
      setCommentText("");
      setRating(0);
      setProfession("");
      setReviewImages([]);
      setCommentStatus("Thanks! Your review will appear after a quick review.");
    } finally {
      setSubmittingComment(false);
    }
  }

  function requireIdentity(action: "like" | "comment") {
    setPendingAction(action);
    setNeedsIdentity(true);
  }

  function confirmIdentity() {
    if (!identityName.trim() || identityPhone.trim().length < 7) return;
    setIdentity(identityName.trim(), identityPhone.trim());
    setNeedsIdentity(false);
    if (pendingAction === "like") doLike();
    else if (pendingAction === "comment") doComment();
    setPendingAction(null);
  }

  return (
    <div className="rounded-sm border p-5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={liked}
          onClick={() => {
            if (liked) return;
            if (!getIdentity()) requireIdentity("like");
            else doLike();
          }}
        >
          {liked ? "♥ Liked" : "♡ Like this product"}
        </Button>
        <button
          type="button"
          onClick={doSave}
          aria-label={saved ? "Remove from saved products" : "Save this product"}
          aria-pressed={saved}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[transform,box-shadow,background-color,color] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:scale-[0.97]"
          style={{
            background: saved ? "color-mix(in srgb, var(--burgundy) 10%, var(--paper))" : "var(--paper-dim)",
            color: saved ? "var(--burgundy)" : "var(--ink)",
          }}
        >
          <SaveIcon filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={doShare}
          aria-label="Share this product"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:scale-[0.97]"
          style={{ background: "var(--paper-dim)" }}
        >
          <ShareIcon />
          Share
        </button>
        <span className="text-sm" style={{ color: "var(--line-strong)" }}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
        {ratedCount > 0 ? (
          <span className="text-sm" style={{ color: "var(--line-strong)" }}>
            · {averageRating.toFixed(1)} ★ ({ratedCount} {ratedCount === 1 ? "review" : "reviews"})
          </span>
        ) : null}
        {shareStatus ? (
          <span className="text-xs" style={{ color: "var(--accent)" }}>
            {shareStatus}
          </span>
        ) : null}
      </div>

      {needsIdentity ? (
        <div className="mt-4 flex flex-col gap-2">
          <input
            placeholder="Your name"
            value={identityName}
            onChange={(e) => setIdentityName(e.target.value)}
            className="rounded-sm border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)" }}
          />
          <input
            placeholder="Phone"
            value={identityPhone}
            onChange={(e) => setIdentityPhone(e.target.value)}
            className="rounded-sm border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)" }}
          />
          <Button type="button" variant="primary" className="self-start" onClick={confirmIdentity}>
            Continue
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!commentText.trim() || rating < 1) return;
          if (!getIdentity()) requireIdentity("comment");
          else doComment();
        }}
        className="mt-5 flex flex-col gap-2"
      >
        <label className="text-xs tracked-caps">Rate this product</label>
        <div className="flex gap-1">
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

        <label className="mt-2 text-xs tracked-caps">Your profession</label>
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="rounded-sm border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        >
          <option value="">Prefer not to say</option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label className="mt-2 text-xs tracked-caps">Leave a review</label>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={2}
          className="rounded-sm border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />

        <label
          className="mt-1 inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs"
          style={{ color: "var(--line-strong)" }}
        >
          <UploadIcon className="h-4 w-4" />
          {reviewImages.length > 0 ? `${reviewImages.length} photo(s) attached` : "Add photos (optional)"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, MAX_REVIEW_IMAGES);
              setReviewImages(files);
            }}
          />
        </label>

        <Button
          type="submit"
          variant="secondary"
          className="self-start"
          disabled={rating < 1 || !commentText.trim() || submittingComment}
        >
          {submittingComment ? "Posting…" : "Post review"}
        </Button>
        {commentStatus ? (
          <p className="text-xs" style={{ color: "var(--line-strong)" }}>
            {commentStatus}
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex flex-col gap-3">
        {comments === null ? (
          <p className="text-sm" style={{ color: "var(--line-strong)" }}>
            Loading comments…
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--line-strong)" }}>
            No comments yet — be the first to share your thoughts.
          </p>
        ) : (
          comments.map((c, i) => (
            <div key={i} className="border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between text-xs" style={{ color: "var(--line-strong)" }}>
                <span>
                  {c.name}
                  {c.profession ? <span> · {c.profession}</span> : null}
                  {c.rating ? <span style={{ color: "var(--accent)" }}> · {"★".repeat(c.rating)}</span> : null}
                </span>
                <span>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <p className="mt-1">{c.comment}</p>
              {c.image_urls?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.image_urls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="Review photo" loading="lazy" decoding="async" className="h-20 w-20 rounded-sm object-cover" />
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
