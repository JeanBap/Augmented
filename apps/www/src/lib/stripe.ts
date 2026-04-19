import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
    );
  }
  return stripePromise;
};

export async function createCheckoutSession(
  productId: string,
  quantity: number = 1
) {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  const { sessionId } = await response.json();
  return sessionId;
}

export async function redirectToCheckout(productId: string) {
  try {
    const sessionId = await createCheckoutSession(productId);
    const stripe = await getStripe();

    if (!stripe) {
      throw new Error("Stripe not loaded");
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}
