"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { Menu, X, LogOut } from "lucide-react";

export function Navigation() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setIsOpen(false);
  }

  return (
    <nav className="bg-brand-navy text-brand-cream sticky top-0 z-50 shadow-lg">
      <div className="container-wide flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-serif font-bold text-brand-gold hover:text-brand-gold/80 transition-colors"
        >
          Raise Ready
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="hover:text-brand-gold transition-colors text-sm font-semibold"
          >
            Home
          </Link>
          <Link
            href="/books"
            className="hover:text-brand-gold transition-colors text-sm font-semibold"
          >
            Books
          </Link>
          <Link
            href="/services"
            className="hover:text-brand-gold transition-colors text-sm font-semibold"
          >
            Services
          </Link>
          <Link
            href="/blog"
            className="hover:text-brand-gold transition-colors text-sm font-semibold"
          >
            Blog
          </Link>

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-cream/20">
              <Link
                href="/dashboard"
                className="hover:text-brand-gold transition-colors text-sm font-semibold"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-semibold hover:text-brand-gold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm py-2 px-4">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-brand-navy/80 rounded-lg transition-colors"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-navy border-t border-cream/10">
          <div className="container-wide py-4 space-y-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold hover:text-brand-gold transition-colors"
            >
              Home
            </Link>
            <Link
              href="/books"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold hover:text-brand-gold transition-colors"
            >
              Books
            </Link>
            <Link
              href="/services"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold hover:text-brand-gold transition-colors"
            >
              Services
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold hover:text-brand-gold transition-colors"
            >
              Blog
            </Link>

            {user ? (
              <>
                <div className="border-t border-cream/10 pt-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm font-semibold hover:text-brand-gold transition-colors mb-3"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm font-semibold hover:text-brand-gold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="btn-primary block text-center text-sm py-2 px-4"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
