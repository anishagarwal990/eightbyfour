import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: "/Users/anishagarwal/Downloads/eightbyfour/.env" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await supabase.storage.from("product-images").list("products", { search: "2382" });
if (error) throw error;
console.log(data.map(f => f.name));
