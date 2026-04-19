"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "@/components/nav-header";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowRight, Plus, BarChart3, Check, Crown, Settings } from "lucide-react";

function PricingCards({
  onSelectPlan,
  currentSubscription,
}: {
  onSelectPlan: (plan: "personal" | "professional" | "bundle") => void;
  currentSubscription: string;
}) {
  const plans = [
    {
      key: "personal" as const,
      label: "Personal",
      price: "$4.99",
      description: "Personal finance tools",
      features: [
        "Save calculations & profiles",
        "Full calculation history",
        "All personal finance tools",
      ],
    },
    {
      key: "professional" as const,
      label: "Professional",
      price: "$9.99",
      description: "Financial model builder",
      features: [
        "5-year financial model builder",
        "3 scenarios (Base/Bull/Bear)",
        "Hiring plan & unit economics",
        "Excel & PDF exports",
      ],
      highlighted: true,
    },
    {
      key: "bundle" as const,
      label: "Both Apps",
      price: "$12.99",
      description: "Everything included",
      features: [
        "Everything in Personal",
        "Everything in Professional",
        "Save 15% vs separate plans",
      ],
      badge: "Best Value",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.key}
          className={`bg-white rounded-xl p-6 border-2 transition-all relative ${
            plan.badge
              ? "border-gold shadow-lg"
              : plan.highlighted
              ? "border-emerald-400/50"
              : "border-navy/10"
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              {plan.badge}
            </div>
          )}
          <div className="text-center mb-4">
            <p className="font-semibold text-navy">{plan.label}</p>
            <p className="text-3xl font-bold text-navy mt-1">{plan.price}</p>
            <p className="text-xs text-navy/50">per month</p>
          </div>
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-navy/70">
                <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelectPlan(plan.key)}
            disabled={currentSubscription === plan.key}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              currentSubscription === plan.key
                ? "bg-navy/10 text-navy/40 cursor-not-allowed"
                : plan.badge
                ? "bg-gold text-navy hover:bg-gold/90"
                : "border border-navy/20 text-navy hover:bg-navy/5"
            }`}
          >
            {currentSubscription === plan.key ? "Current Plan" : "Subscribe"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { subscription, hasProAccess, loading, startSubscription, manageSubscription } =
    useSubscription();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream">
        <NavHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
              <BarChart3 className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-5xl font-bold text-navy mb-4">
              Build your investor-ready financial model
            </h1>
            <p className="text-xl text-navy/60 mb-8">
              Create professional 5-year financial projections in minutes.
              Perfect for fundraising, board meetings, and strategic planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 transition-colors"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://app.raisereadybook.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy/20 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors"
              >
                Personal Finance Tools
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="text-2xl font-bold text-gold mb-2">5-Year</div>
              <p className="text-navy/60">
                Project revenue, expenses, and cash flow for 60 months with
                monthly detail.
              </p>
            </div>
            <div className="card p-6">
              <div className="text-2xl font-bold text-gold mb-2">
                Professional
              </div>
              <p className="text-navy/60">
                Generate board-ready reports, sensitivity analysis, and
                financial statements.
              </p>
            </div>
            <div className="card p-6">
              <div className="text-2xl font-bold text-gold mb-2">
                Investor-Ready
              </div>
              <p className="text-navy/60">
                Export to Excel or PDF with beautiful formatting ready to share
                with investors.
              </p>
            </div>
          </div>

          {/* Pricing section for unauthenticated users */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-navy text-center mb-4">
              Simple Pricing
            </h2>
            <p className="text-center text-navy/60 mb-8">
              Free to try. Subscribe to save models and export reports.
            </p>
            <PricingCards
              onSelectPlan={() => {
                window.location.href = "/auth/login";
              }}
              currentSubscription="free"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-navy">My Financial Models</h1>
            {subscription !== "free" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
                <Crown className="w-3 h-3" />
                {subscription === "bundle"
                  ? "Both Apps"
                  : subscription === "professional"
                  ? "Pro"
                  : "Personal"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {subscription === "free" && (
              <button
                onClick={() => startSubscription("professional")}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gold text-gold font-semibold rounded-lg hover:bg-gold/5 transition-colors text-sm"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </button>
            )}
            {subscription !== "free" && (
              <button
                onClick={manageSubscription}
                className="inline-flex items-center gap-2 px-3 py-2 text-navy/60 hover:text-navy hover:bg-navy/5 rounded-lg transition-colors"
                title="Manage subscription"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Model
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="text-center py-12">
            <p className="text-navy/60">
              No models yet. Create your first financial model to get started.
            </p>
          </div>
        </div>

        {/* Show pricing cards if user is on free plan */}
        {subscription === "free" && (
          <div className="mt-12 pt-12 border-t border-navy/10">
            <h2 className="text-2xl font-bold text-navy text-center mb-2">
              Unlock Full Access
            </h2>
            <p className="text-center text-navy/60 mb-8">
              Subscribe to save models, export reports, and access premium
              features.
            </p>
            <PricingCards
              onSelectPlan={startSubscription}
              currentSubscription={subscription}
            />
          </div>
        )}
      </main>
    </div>
  );
}
