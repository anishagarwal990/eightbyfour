import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const BUCKET = "product-images";
const PATH = "brands/propperly.png";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const buffer = readFileSync(process.argv[2]);

const { error } = await supabase.storage.from(BUCKET).upload(PATH, buffer, {
  contentType: "image/png",
  upsert: true,
});
if (error) throw new Error(`Upload failed: ${error.message}`);

const { data } = supabase.storage.from(BUCKET).getPublicUrl(PATH);
console.log("Uploaded:", data.publicUrl);
