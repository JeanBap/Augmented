"use client";

import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { LogOut } from "lucide-react";

export function NavHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-navy/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-navy hover:text-gold transition-colors"
            >
              Financial Model Pro
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="https://raisereadybook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy/60 hover:text-navy transition-colors"
              >
                Raise Ready
              </Link>
              <Link
                href="/dashboard"
                className="text-navy/60 hover:text-navy transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-navy/60">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-navy/5 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-navy" />
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
