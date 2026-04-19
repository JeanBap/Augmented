import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error)}`,
        request.nextUrl.origin
      )
    );
  }

  if (code) {
    // TODO: Exchange code for session using @raiseready/auth
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=invalid_request", request.nextUrl.origin)
  );
}
