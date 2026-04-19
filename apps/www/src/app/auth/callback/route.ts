import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@raiseready/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/auth/login?error=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  // Handle successful OAuth callback
  if (code) {
    try {
      const supabase = createClient();

      // Exchange code for session
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/auth/login?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }

      if (data.session) {
        // Redirect to dashboard on successful sign in
        return NextResponse.redirect(
          new URL("/dashboard", request.nextUrl.origin)
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      return NextResponse.redirect(
        `${request.nextUrl.origin}/auth/login?error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin));
}
