"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAdminBrowserClient } from "@/lib/supabase/admin-browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full px-3 py-1 text-xs hover:opacity-70 disabled:opacity-50"
      style={{ background: "var(--paper-dim)" }}
      onClick={() =>
        startTransition(async () => {
          await createAdminBrowserClient().auth.signOut();
          // refresh() re-runs the server layout so the header clears before
          // the redirect lands, instead of flashing a signed-in shell.
          router.refresh();
          router.replace("/admin/login");
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
