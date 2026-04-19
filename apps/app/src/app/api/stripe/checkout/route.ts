import { NextRequest, NextResponse } from "next/server";

// Products available on the personal finance app (templates, premium tools)
const products: Record<string, { name: string; price: number; type: string }> = {
  "financial-template-basic": {
    name: "Basic Financial Template",
    price: 499,
    type: "template",
  },
  "financial-template-pro": {
    name: "Pro Financial Template Bundle",
    price: 1999,
    type: "template",
  },
  "premium-calculators": {
    name: "Premium Calculator Access",
    price: 999,
    type: "tool_export",
  },
  // Books available from any subdomain
  "start-ready": { name: "Start Ready Book", price: 499, type: "book" },
  "raise-ready": { name: "Raise Ready Book", price: 999, type: "book" },
  "model-ready": { name: "Model Ready Book", price: 999, type: "book" },
  "exit-ready": { name: "Exit Ready Book", price: 999, type: "book" },
};

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity = 1 } = await request.json();

    if (!productId || !(productId in products)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const product = products[productId];

    // Demo mode
    if (process.env.STRIPE_SECRET_KEY === "sk_test_demo") {
      return NextResponse.json({
        sessionId: `demo_checkout_${productId}_${Date.now()}`,
        isDemoMode: true,
        product: product.name,
        amount: `$${(product.price * quantity / 100).toFixed(2)}`,
        message: "Demo checkout (would redirect to Stripe in production)",
      });
    }

    // Production: create real Stripe session
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: product.price,
        },
        quantity,
      }],
      mode: "payment",
      success_url: `${request.nextUrl.origin}/dashboard?purchase=success`,
      cancel_url: `${request.nextUrl.origin}/`,
      metadata: { productId, productType: product.type },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
