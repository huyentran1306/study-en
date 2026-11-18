import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Nếu truy cập từ subdomain chuyên cho Đảo (ví dụ: island.xxx hoặc dao.xxx)
  const isIslandDomain = host.startsWith("island.") || host.startsWith("dao.");

  if (isIslandDomain) {
    // Bỏ qua static assets và API
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Vào trang chủ "/" -> rewrite thẳng vào "/island"
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/island", request.url));
    }

    // Các đường dẫn con -> rewrite vào "/island/..."
    if (!pathname.startsWith("/island")) {
      return NextResponse.rewrite(new URL(`/island${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
