"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@raiseready/auth";
import { Button } from "./ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { useState } from "react";

export function NavHeader() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-navy/10 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={process.env.NEXT_PUBLIC_WWW_URL || "https://raisereadybook.com"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <span className="font-bold text-navy text-lg">RR</span>
          </div>
          <span className="font-bold text-navy hidden sm:inline">Raise Ready</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-navy hover:text-gold transition-colors font-medium">
            Tools
          </Link>

          <a
            href={process.env.NEXT_PUBLIC_FINANCE_URL || "https://finance.raisereadybook.com"}
            className="text-navy hover:text-gold transition-colors font-medium"
          >
            Finance Hub
          </a>

          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {user.email}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button className="btn-primary">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button className="btn-primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-cream border-t border-navy/10 px-4 py-4 space-y-3">
          <Link
            href="/"
            className="block text-navy hover:text-gold transition-colors font-medium py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Tools
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_FINANCE_URL || "https://finance.raisereadybook.com"}
            className="block text-navy hover:text-gold transition-colors font-medium py-2"
          >
            Finance Hub
          </a>
        </div>
      )}
    </header>
  );
}
