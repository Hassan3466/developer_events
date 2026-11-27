import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isStaticAsset = pathname === "/ingest/static" || pathname.startsWith("/ingest/static/");
  const upstreamHost = isStaticAsset
    ? "https://us-assets.posthog.com"
    : "https://us.i.posthog.com";
  const upstreamPath = pathname.slice("/ingest".length) || "/";
  const destination = new URL(upstreamPath, upstreamHost);
  destination.search = search;

  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  headers.delete("proxy-authorization");

  return NextResponse.rewrite(destination, {
    request: { headers },
  });
}

export const config = {
  matcher: ["/ingest/:path*"],
};
