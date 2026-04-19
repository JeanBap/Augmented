import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@raiseready/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Product definitions
const products = {
  "start-ready": {
    name: "Start Ready Book",
    price: 499,
    type: "book",
  },
  "raise-ready": {
    name: "Raise Ready Book",
    price: 999,
    type: "book",
  },
  "model-ready": {
    name: "Model Ready Book",
    price: 999,
    type: "book",
  },
  "exit-ready": {
    name: "Exit Ready Book",
    price: 999,
    type: "book",
  },
  "fundraising-audit": {
    name: "Fundraising Readiness Audit",
    price: 99000,
    type: "service",
  },
  "fractional-advisory": {
    name: "Fractional Fundraise Advisory",
    price: 200000,
    type: "service",
  },
  "model-build": {
    name: "Model Build",
    price: 500000,
    type: "service",
  },
};

type ProductKey = keyof typeof products;

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity = 1 } = await request.json();

    // Validate product
    if (!productId || !(productId in products)) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    const product = products[productId as ProductKey];

    // Demo mode check
    if (process.env.STRIPE_SECRET_KEY === "sk_test_demo") {
      return NextResponse.json({
        sessionId: `demo_checkout_${productId}_${Date.now()}`,
        isDemoMode: true,
        message: "Demo checkout session (would redirect to Stripe in production)",
      });
    }

    const supabase = createClient();

    // Get session (user should be authenticated)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
            },
            unit_amount: product.price,
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: {
        productId,
        userId: session.user.id,
        productType: product.type,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
