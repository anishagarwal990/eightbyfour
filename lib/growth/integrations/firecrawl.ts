// Firecrawl adapter — server-only. Talks to Firecrawl's REST API directly
// (https://api.firecrawl.dev), not the Firecrawl MCP tool: the MCP server
// connected to this Claude session only exposes search, not scrape/crawl/map,
// so it can't be reused from the deployed app anyway. This is a real HTTP
// call, gated on FIRECRAWL_API_KEY actually being set — no fallback to fake
// data if it's missing.
//
// Scope, deliberately narrow for v1: a single-page scrape, used by Market
// Intelligence's competitor analysis. Crawl/map (multi-page) are real
// Firecrawl endpoints too but not wired here — add them the same way when a
// module needs more than one page per run.
//
// Server-only by convention, not by the `server-only` package (not a
// dependency here) — only ever import this from a Server Action or Server
// Component. Importing it from a "use client" file would bundle
// FIRECRAWL_API_KEY-reading code into the client JS, though the key itself
// (read from process.env at call time, not baked in) would still only leak
// if actually invoked client-side.

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

export interface FirecrawlScrapeResult {
  url: string;
  title: string | null;
  description: string | null;
  markdown: string;
  scrapedAt: string;
}

export class FirecrawlNotConfiguredError extends Error {
  constructor() {
    super("FIRECRAWL_API_KEY is not set.");
    this.name = "FirecrawlNotConfiguredError";
  }
}

export function isFirecrawlConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

/**
 * Scrapes one URL and returns its main content as markdown plus title/meta
 * description. Throws FirecrawlNotConfiguredError if no key is set (callers
 * should catch this and record it as a task failure, not swallow it) and a
 * plain Error with Firecrawl's own message on a non-2xx response.
 */
export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new FirecrawlNotConfiguredError();

  const res = await fetch(`${FIRECRAWL_API}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Firecrawl scrape failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    data?: { markdown?: string; metadata?: { title?: string; description?: string; sourceURL?: string } };
    error?: string;
  };

  if (!json.success || !json.data) throw new Error(json.error ?? "Firecrawl returned no data.");

  return {
    url: json.data.metadata?.sourceURL ?? url,
    title: json.data.metadata?.title ?? null,
    description: json.data.metadata?.description ?? null,
    markdown: json.data.markdown ?? "",
    scrapedAt: new Date().toISOString(),
  };
}
