// Grade values in the DB are already clean codes (STR/BWP/FR/BWR/MR), but
// warranty and certification are free text entered per-product — these
// normalize them into stable buckets/codes so filter chips don't fragment
// into one chip per product (e.g. "30 Year Warranty" vs "30 Years Warranty",
// or "IS 710 (BWP Grade)" vs "IS 710:2010 (Marine Grade)").
export function warrantyBucket(warranty: string | null): string {
  if (!warranty) return "Unspecified";
  if (/life\s*time/i.test(warranty)) return "Lifetime";
  const match = warranty.match(/(\d+)\s*Years?/i);
  return match ? `${match[1]} Years` : warranty;
}

export function warrantyBucketSortKey(bucket: string): number {
  if (bucket === "Lifetime") return Infinity;
  if (bucket === "Unspecified") return -1;
  const n = parseInt(bucket, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function certificationCodes(certifications: string[] | null): string[] {
  if (!certifications) return [];
  return certifications.map((c) => {
    const standard = c.match(/^(IS|BS)\s?(\d+)/i);
    if (standard) return `${standard[1].toUpperCase()} ${standard[2]}`;
    if (/CARB/i.test(c)) return "CARB";
    if (/E-0 Emission/i.test(c)) return "E-0 Emission";
    return c;
  });
}
