"use client";

import { useState, useTransition } from "react";
import { scrapeCompetitorAction } from "@/app/admin/growth/actions";
import { GrowthButton } from "@/components/admin/growth/ui";

/** Calls Firecrawl for real — see scrapeCompetitorAction. Not a queue button. */
export function ScrapeCompetitorButton({ itemId }: { itemId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <GrowthButton
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await scrapeCompetitorAction(itemId);
            setMessage(result.message);
            setFailed(!result.ok);
          })
        }
      >
        {isPending ? "Scraping…" : "Scrape with Firecrawl"}
      </GrowthButton>
      {message ? (
        <span className="text-xs" style={{ color: failed ? "#9E3B2F" : "var(--line-strong)" }}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
