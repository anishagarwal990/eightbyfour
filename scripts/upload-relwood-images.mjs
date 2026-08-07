import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join("/Users/anishagarwal/Downloads/eightbyfour", ".env") });

const BUCKET = "product-images";
const SCRATCH = "/private/tmp/claude-501/-Users-anishagarwal-Downloads-eightbyfour/9e57ced0-806e-4abc-9507-4680a3732eed/scratchpad";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function upload(localPath, remotePath, contentType) {
  const buffer = readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(remotePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed for ${remotePath}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(remotePath);
  console.log(remotePath, "->", data.publicUrl);
}

await upload(join(SCRATCH, "relwood-logo.svg"), "brands/relwood.svg", "image/svg+xml");
await upload(join(SCRATCH, "relwood-board.jpg"), "products/2382-main.jpg", "image/jpeg");
