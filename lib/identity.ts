export interface Identity {
  name: string;
  phone: string;
}

export function getIdentity(): Identity | null {
  try {
    return JSON.parse(localStorage.getItem("ebfour_identity") || "null");
  } catch {
    return null;
  }
}

export function setIdentity(name: string, phone: string): void {
  try {
    localStorage.setItem("ebfour_identity", JSON.stringify({ name, phone }));
  } catch {
    // storage unavailable — non-fatal
  }
}

export function hasLiked(productId: number): boolean {
  try {
    return localStorage.getItem(`ebfour_liked_${productId}`) === "1";
  } catch {
    return false;
  }
}

export function markLiked(productId: number): void {
  try {
    localStorage.setItem(`ebfour_liked_${productId}`, "1");
  } catch {
    // storage unavailable — non-fatal
  }
}
