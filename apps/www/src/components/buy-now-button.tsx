"use client";

import { useState } from "react";
import { redirectToCheckout } from "@/lib/stripe";

interface BuyNowButtonProps {
  productId: string;
}

export function BuyNowButton({ productId }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuyNow() {
    setLoading(true);
    try {
      await redirectToCheckout(productId);
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuyNow}
      disabled={loading}
      className="btn-primary"
    >
      {loading ? "Loading..." : "Buy Now"}
    </button>
  );
}
