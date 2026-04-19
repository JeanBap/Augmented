"use client";

import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "./nav-header";
import { Button } from "./ui/button";
import { ArrowLeft, Save, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CalculatorLayoutProps {
  title: string;
  description: string;
  slug: string;
  children: React.ReactNode;
}

export function CalculatorLayout({
  title,
  description,
  slug,
  children,
}: CalculatorLayoutProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save calculations");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement save calculation logic
      toast.success("Calculation saved successfully");
    } catch (error) {
      toast.error("Failed to save calculation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: url,
      }).catch(() => {
        // Fallback to copy to clipboard
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      <NavHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Back Link & Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-navy/60 hover:text-navy transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Calculators
          </Link>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-navy mb-3">
                {title}
              </h1>
              <p className="text-lg text-navy/60 max-w-2xl">
                {description}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              {user && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isSaving ? "Saving..." : "Save"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          <div className="h-1 w-20 bg-gold rounded-full"></div>
        </div>

        {/* Calculator Content */}
        {children}
      </main>
    </div>
  );
}
