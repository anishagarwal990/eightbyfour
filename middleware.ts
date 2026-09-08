import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Two jobs, for /admin and /studio:
//   1. Refresh the Supabase session cookie, or it expires mid-edit and a save
//      fails after the form has already been filled in.
//   2. Gate the whole area. The pages check auth again server-side — this is
//      the cheap first door, not the lock.
//
// Studio EightxFour is gated here while it is still being built: the pricing
// engines quote real rupees off rates that are not yet validated (see
// docs/STUDIO-PRICING-VALIDATION.md), so it is not something a stranger
// should be able to get a number out of. It shares the admin sign-in rather
// than growing a second account system, and app/(site)/studio/layout.tsx
// does the actual authorization — signed in is not the same as allowlisted.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser(), not getSession() — getSession() trusts the cookie without
  // verifying it, which is forgeable and useless as an access check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    // A fetch from the Studio configurators wants a status it can handle, not
    // an HTML login page parsed as JSON.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Preserve where they were headed so the login can bounce them back,
    // but only the path — never a full URL, which would be an open redirect.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    // `next` is validated on the login page itself; honour it so signing in
    // from a Studio link lands back on Studio rather than the catalogue admin.
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/studio", "/studio/:path*", "/api/studio/:path*"],
};
