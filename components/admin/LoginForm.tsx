"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminBrowserClient } from "@/lib/supabase/admin-browser";
import { Button } from "@/components/ui/Button";

const INPUT_CLASS = "w-full rounded-md border px-3 py-2 text-sm";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: signInError } = await createAdminBrowserClient().auth.signInWithPassword({ email, password });
    if (signInError) {
      // Supabase already returns a deliberately vague message for bad
      // credentials; don't add detail that would confirm whether an email
      // exists on the project.
      setError(signInError.message);
      setPending(false);
      return;
    }
    // refresh() first so the server layout re-reads the new session cookie —
    // without it the destination renders once as signed-out.
    router.refresh();
    router.replace(redirectTo);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label className="text-xs" style={{ color: "var(--line-strong)" }}>
        Email
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${INPUT_CLASS} mt-1`}
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />
      </label>
      <label className="text-xs" style={{ color: "var(--line-strong)" }}>
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${INPUT_CLASS} mt-1`}
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />
      </label>
      {error ? (
        <p className="text-sm" style={{ color: "var(--burgundy)" }}>
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-1 self-start">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
