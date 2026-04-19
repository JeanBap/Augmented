"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@raiseready/auth";

export type SubscriptionStatus = "free" | "personal" | "professional" | "bundle";

interface SubscriptionState {
  subscription: SubscriptionStatus;
  loading: boolean;
  hasProAccess: boolean;
  hasPersonalAccess: boolean;
  checkSubscription: () => Promise<void>;
  startSubscription: (plan: "personal" | "professional" | "bundle") => Promise<void>;
  manageSubscription: () => Promise<void>;
}

/**
 * Hook to check and manage Raise Ready subscriptions.
 * Calls the shared Supabase edge functions (check-payment, create-payment, create-portal-session).
 * These edge functions are shared across calculateapr and the finance app.
 *
 * NOTE: This does NOT check cafe manager subscriptions (greekcafemanager.com).
 * The cafe manager has its own separate Stripe products and API routes.
 */
export function useSubscription(): SubscriptionState {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>("free");
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/check-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data?.subscription) {
        setSubscription(data.subscription as SubscriptionStatus);
      } else if (data?.hasAccess && data?.plan) {
        // Backward compat
        setSubscription(data.plan === "monthly" || data.plan === "lifetime" ? "personal" : "free");
      } else {
        setSubscription("free");
      }
    } catch {
      // On error, default to free
      setSubscription("free");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, supabaseUrl, supabaseAnonKey]);

  const startSubscription = useCallback(
    async (plan: "personal" | "professional" | "bundle") => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (data?.url) {
          window.open(data.url, "_blank");
        }
      } catch (err) {
        console.error("Checkout error:", err);
      }
    },
    [session?.access_token, supabaseUrl, supabaseAnonKey]
  );

  const manageSubscription = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
        },
      });
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
  }, [session?.access_token, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (user && session?.access_token) {
      checkSubscription();
    } else {
      setSubscription("free");
    }
  }, [user, session?.access_token, checkSubscription]);

  return {
    subscription,
    loading,
    hasProAccess: subscription === "professional" || subscription === "bundle",
    hasPersonalAccess: subscription === "personal" || subscription === "bundle",
    checkSubscription,
    startSubscription,
    manageSubscription,
  };
}
