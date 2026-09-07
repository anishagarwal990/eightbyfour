"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface Actionish {
  ok: boolean;
  message: string;
}

/** Shared wrapper: run a server action, surface its message, refresh on success. */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Actionish | null>(null);

  const run = useCallback(
    (fn: () => Promise<Actionish>, opts?: { onSuccess?: (r: Actionish) => void }) => {
      startTransition(async () => {
        const res = await fn();
        setResult(res);
        if (res.ok) {
          opts?.onSuccess?.(res);
          router.refresh();
        }
      });
    },
    [router]
  );

  return { pending, result, setResult, run };
}
