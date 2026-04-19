import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@raiseready/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  // Demo mode check
  if (process.env.STRIPE_SECRET_KEY === "sk_test_demo") {
    return NextResponse.json(
      { received: true, isDemoMode: true, message: "Demo webhook (would process in production)" }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook verification error:", error);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid" && session.metadata) {
          // Record purchase in database
          const { userId, productId, productType } = session.metadata;

          // Insert into purchases table - wrapped in try/catch for type safety
          try {
            const { error } = await (supabase.from("purchases") as any).insert({
              user_id: userId,
              product_id: productId,
              product_type: productType,
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              status: "completed",
              purchased_at: new Date().toISOString(),
            });

            if (error) {
              console.error("Error recording purchase:", error);
            }
          } catch (dbError) {
            console.error("Error inserting purchase record:", dbError);
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Update purchase status to refunded - wrapped in try/catch
        try {
          const { error } = await (supabase.from("purchases") as any)
            .update({ status: "refunded" })
            .match({ stripe_payment_intent: charge.payment_intent });

          if (error) {
            console.error("Error updating refund status:", error);
          }
        } catch (dbError) {
          console.error("Error updating refund status:", dbError);
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.warn("Dispute created:", dispute.id);
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
