"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "@/components/nav-header";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { Download, CreditCard, Crown, Settings } from "lucide-react";

interface SavedModel {
  id: string;
  name: string;
  company: string;
  industry: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { subscription, hasProAccess, manageSubscription, startSubscription } =
    useSubscription();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: models = [], isLoading } = useQuery<SavedModel[]>({
    queryKey: ["models", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // TODO: Fetch from Supabase using @raiseready/db
      return [];
    },
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-navy mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card p-6">
            <p className="text-sm text-navy/60 mb-2">Models Created</p>
            <p className="text-3xl font-bold text-navy">{models.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-navy/60 mb-2">Total Exports</p>
            <p className="text-3xl font-bold text-navy">0</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-navy/60 mb-2">Subscription</p>
            <div className="flex items-center gap-2">
              <p
                className={`text-3xl font-bold ${
                  hasProAccess ? "text-gold" : "text-navy/40"
                }`}
              >
                {subscription === "bundle"
                  ? "Bundle"
                  : subscription === "professional"
                  ? "Pro"
                  : subscription === "personal"
                  ? "Personal"
                  : "Free"}
              </p>
              {hasProAccess && <Crown className="w-5 h-5 text-gold" />}
            </div>
          </div>
        </div>

        {user && (
          <div className="flex justify-end gap-3 mb-8">
            {subscription === "free" && (
              <button
                onClick={() => startSubscription("professional")}
                className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </button>
            )}
            {subscription !== "free" && (
              <button
                onClick={manageSubscription}
                className="flex items-center gap-2 px-4 py-2 border border-navy/20 rounded-lg text-sm text-navy hover:bg-navy/5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Subscription
              </button>
            )}
          </div>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-navy mb-6">My Models</h2>
          {isLoading ? (
            <div className="card p-12 text-center">
              <p className="text-navy/60">Loading...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-navy/60 mb-4">No models yet</p>
              <a
                href="/model/new"
                className="inline-block px-6 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 transition-colors"
              >
                Create Your First Model
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {models.map((model) => (
                <a
                  key={model.id}
                  href={`/model/${model.id}`}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-navy mb-1">
                        {model.company}
                      </h3>
                      <p className="text-sm text-navy/60">
                        {model.industry} &middot; Created{" "}
                        {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-navy/60">
                        <Download className="w-4 h-4" />
                        <span>0</span>
                      </div>
                      <button className="text-gold hover:text-gold/80 font-medium">
                        Open &rarr;
                      </button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
