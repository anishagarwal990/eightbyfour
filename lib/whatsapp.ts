export const WHATSAPP_NUMBER = "919666634253";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function generateInquiryRef(brand?: string): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const suffix = brand ? brand.slice(0, 3).toUpperCase() : "GEN";
  return `REF-${digits}-${suffix}`;
}
