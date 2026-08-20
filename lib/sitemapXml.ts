export interface SitemapUrlEntry {
  url: string;
  lastModified?: Date | string;
}

function toIso(d: Date | string): string {
  return typeof d === "string" ? d : d.toISOString();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function urlsetXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((e) => {
      const lastmod = e.lastModified ? `\n    <lastmod>${toIso(e.lastModified)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeXml(e.url)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function sitemapIndexXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((e) => {
      const lastmod = e.lastModified ? `\n    <lastmod>${toIso(e.lastModified)}</lastmod>` : "";
      return `  <sitemap>\n    <loc>${escapeXml(e.url)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}
