import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CF_TOKEN = process.env.CF_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
if (!CF_TOKEN || !CF_ACCOUNT_ID) {
  console.error("Missing CF_TOKEN or CF_ACCOUNT_ID env vars");
  process.exit(1);
}

const urls = JSON.parse(readFileSync(new URL("./image-urls.json", import.meta.url)));
const progressPath = new URL("./migrate-progress.json", import.meta.url);
const progress = existsSync(progressPath) ? JSON.parse(readFileSync(progressPath)) : { done: {}, failed: {} };

// Pure string derivation, no crypto — must stay byte-identical to the
// cfImageId() in the Next.js custom image loader (lib/cloudflareImageLoader.ts),
// and must run identically in Node and the browser (loaders can execute
// client-side for srcset generation, where node:crypto isn't available).
const SUPABASE_PREFIX = "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/";
export function cfImageId(url) {
  const path = url.startsWith(SUPABASE_PREFIX) ? url.slice(SUPABASE_PREFIX.length) : url;
  const noExt = path.replace(/\.[a-zA-Z0-9]+$/, "");
  const slug = noExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `ebf-${slug}`;
}

const CONCURRENCY = 8;
let i = 0;
let okCount = 0;
let existedCount = 0;
let failCount = 0;

async function uploadOne(url) {
  const id = cfImageId(url);
  if (progress.done[id]) {
    okCount++;
    return;
  }
  const form = new FormData();
  form.set("url", url);
  form.set("id", id);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CF_TOKEN}` },
      body: form,
    });
    const json = await res.json();
    if (json.success) {
      progress.done[id] = url;
      okCount++;
    } else if (json.errors?.[0]?.code === 5409) {
      // already exists — fine, idempotent re-run
      progress.done[id] = url;
      existedCount++;
    } else {
      progress.failed[id] = { url, errors: json.errors };
      failCount++;
      console.error("FAIL", url, JSON.stringify(json.errors));
    }
  } catch (e) {
    progress.failed[id] = { url, errors: String(e) };
    failCount++;
    console.error("FAIL", url, String(e));
  }
}

async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    await uploadOne(url);
    if ((okCount + existedCount + failCount) % 100 === 0) {
      writeFileSync(progressPath, JSON.stringify(progress));
      console.log(`progress: ${okCount + existedCount + failCount}/${urls.length} (ok=${okCount} existed=${existedCount} failed=${failCount})`);
    }
  }
}

console.log(`Starting migration of ${urls.length} images, concurrency=${CONCURRENCY}`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
writeFileSync(progressPath, JSON.stringify(progress));
console.log(`Done. ok=${okCount} existed=${existedCount} failed=${failCount} total=${urls.length}`);
