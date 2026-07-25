"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getIdentity, setIdentity, hasLiked, markLiked } from "@/lib/identity";
import { Button } from "@/components/ui/Button";

interface Comment {
  name: string;
  comment: string;
  created_at: string;
}

export function LikeCommentWidget({ productId }: { productId: number }) {
  const supabase = createBrowserSupabaseClient();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(() => (typeof window !== "undefined" ? hasLiked(productId) : false));
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [pendingAction, setPendingAction] = useState<"like" | "comment" | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityPhone, setIdentityPhone] = useState("");
  const [commentStatus, setCommentStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("get_like_counts").then(({ data }) => {
      const row = data?.find((r: { product_id: number; like_count: number }) => r.product_id === productId);
      if (row) setLikeCount(Number(row.like_count));
    });
    supabase
      .from("product_comments")
      .select("name, comment, created_at")
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

  async function doComment() {
    const identity = getIdentity();
    const text = commentText.trim();
    if (!identity || !text) return;
    const { error } = await supabase
      .from("product_comments")
      .insert({ product_id: productId, name: identity.name, phone: identity.phone, comment: text });
    if (error) {
      setCommentStatus("Couldn't post your comment. Please try again.");
      return;
    }
    setCommentText("");
    setCommentStatus("Thanks! Your comment will appear after a quick review.");
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
      <div className="flex items-center gap-3">
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
          {liked ? "♥ Liked" : "♡ Like this veneer"}
        </Button>
        <span className="text-sm" style={{ color: "var(--line-strong)" }}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
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
          if (!commentText.trim()) return;
          if (!getIdentity()) requireIdentity("comment");
          else doComment();
        }}
        className="mt-5 flex flex-col gap-2"
      >
        <label className="text-xs tracked-caps">Leave a comment</label>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={2}
          className="rounded-sm border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
        <Button type="submit" variant="secondary" className="self-start">
          Post comment
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
                <span>{c.name}</span>
                <span>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <p className="mt-1">{c.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
