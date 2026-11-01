import type { NextRequest } from "next/server";
import { getAuth0 } from "@/lib/auth/auth0";

export async function middleware(request: NextRequest) {
  return getAuth0().middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
