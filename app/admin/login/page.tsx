import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only ever accept a same-site path. Taking the raw value would let
  // /admin/login?next=https://elsewhere.example turn this into an open
  // redirect that borrows the site's credibility for a phishing link.
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        Catalogue admin
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
        Sign in to edit product data.
      </p>
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
