import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { modelId, userId } = await request.json();

    if (!modelId || !userId) {
      return NextResponse.json(
        { error: "Missing modelId or userId" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Financial Model Export",
              description:
                "Export financial model to Excel/PDF format",
            },
            unit_amount: 1000, // $10 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/model/${modelId}?export_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/model/${modelId}`,
      metadata: {
        modelId,
        userId,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
