import Link from "next/link";
import { Mail, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-navy text-brand-cream">
      <div className="container-wide py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-serif font-bold text-brand-gold mb-4">
              Raise Ready
            </h3>
            <p className="text-sm text-brand-cream/80">
              Build your investor-ready financial model in 60 minutes.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/books"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Books
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href={process.env.NEXT_PUBLIC_APP_URL || "#"}
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Model Builder
                </Link>
              </li>
              <li>
                <Link
                  href={process.env.NEXT_PUBLIC_FINANCE_URL || "#"}
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Finance Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-brand-cream/80 hover:text-brand-gold transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cream/10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-brand-cream/80">
              © {new Date().getFullYear()} Raise Ready. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="mailto:hello@raisereadybook.com"
                className="text-brand-cream/80 hover:text-brand-gold transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-brand-cream/80 hover:text-brand-gold transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-brand-cream/80 hover:text-brand-gold transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
