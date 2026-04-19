import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Demo mode
  if (process.env.STRIPE_SECRET_KEY === "sk_test_demo") {
    return NextResponse.json({ received: true, demo: true });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") || "";

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { productId, productType } = session.metadata || {};

      // Record purchase in Supabase (using service role)
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from("purchases").insert({
        user_id: session.metadata?.userId,
        product_type: productType || "template",
        product_id: productId || "unknown",
        stripe_payment_id: session.payment_intent as string,
        stripe_customer_id: session.customer as string,
        amount_cents: session.amount_total || 0,
        currency: session.currency || "usd",
        status: "completed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
