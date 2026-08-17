import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MAIN_IMG_URL = "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/2383-main.png";

const variants = {
  unit: "sqft",
  currency: "INR",
  gst: "excl",
  cores: [
    {
      key: "hardwood",
      label: "Hardwood",
      sizes: [
        {
          key: "8x4",
          label: "8×4 ft",
          thicknesses: [
            { key: "16mm", label: "16mm", price: 78 },
            { key: "18mm", label: "18mm", price: 85 },
            { key: "25mm", label: "25mm", price: 95 },
          ],
        },
      ],
    },
    {
      key: "pinewood",
      label: "Pinewood",
      sizes: [
        {
          key: "8x4",
          label: "8×4 ft",
          thicknesses: [
            { key: "16mm", label: "16mm", price: 88 },
            { key: "18mm", label: "18mm", price: 95 },
            { key: "25mm", label: "25mm", price: 105 },
          ],
        },
        {
          key: "10x4",
          label: "10×4 ft",
          thicknesses: [
            { key: "18mm", label: "18mm", price: 125 },
            { key: "25mm", label: "25mm", price: 145 },
          ],
        },
      ],
    },
  ],
};

const allPrices = variants.cores.flatMap((c) => c.sizes.flatMap((s) => s.thicknesses.map((t) => t.price)));

const row = {
  id: 2385,
  slug: "propperly-blockboard",
  category: "Blockboard",
  brand: "Propperly",
  name: "Blockboard",
  size: "8×4 ft, 10×4 ft",
  thicknesses: ["16mm", "18mm", "25mm"],
  core: "Hardwood or pinewood block core, veneer faced — pick below",
  price_table: { min_price: Math.min(...allPrices), max_price: Math.max(...allPrices), unit: "sqft", currency: "INR", gst: "excl" },
  variants,
  applications: ["Long-span shelving", "Wardrobe shutters", "Worktops & countertops", "Modular kitchen carcass", "Office furniture"],
  description:
    "Blockboard has a solid core of glued timber strips sandwiched between veneer faces — prized for holding screws well and resisting sag over long, unsupported spans like shelving and worktops. Choose pinewood core for a lighter, more affordable board, or hardwood core for extra density and strength on longer spans.",
  main_img_url: MAIN_IMG_URL,
};

async function main() {
  const { error: delError } = await supabase.from("products").delete().in("id", [2383, 2384]);
  if (delError) throw delError;
  console.log("Deleted old rows 2383, 2384");

  const { error: insError } = await supabase.from("products").upsert(row, { onConflict: "id" });
  if (insError) throw insError;
  console.log(`Inserted merged product id=${row.id} slug=${row.slug}`);

  const { error: rmError } = await supabase.storage.from("product-images").remove(["products/2384-main.png"]);
  if (rmError) console.error("Storage cleanup warning:", rmError.message);
  else console.log("Removed redundant products/2384-main.png from storage");
}

main().catch((err) => {
  console.error("Merge failed:", err);
  process.exitCode = 1;
});
