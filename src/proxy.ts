import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  // Exclude API, Next internals, public static assets (e.g. /images/*, .png/.svg)
  // and the PWA manifest, so unauthenticated asset requests — including
  // next/image's own upstream fetch and the browser's manifest fetch —
  // aren't redirected to /login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
