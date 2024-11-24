import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";

//! Handle POST request from stripe webhook
export async function POST(req: Request) {
  //!get the raw body and Stripe signature from the request
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    //! Verify the webhook event using stripe signing secret
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
  //! extract the session from the event data
  const session = event.data.object as Stripe.Checkout.Session;

  //!Handle successful checkout completion
  if (event.type === "checkout.session.completed") {
    //!Retrieve the subscription details from stripe
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    //! Verify that userId exists in the session metadata
    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }
    //! create a new subscription record in the database
    await prismadb.userSubscription.create({
      data: {
        userId: session?.metadata?.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }
  //!Handle successful invoice payment (subscription renewal)

  if (event.type === "invoice.payment_succeeded") {
    //!Retrive the updated subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    //!Update the subscription record in the database
    await prismadb.userSubscription.update({
      where: {
        userId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }
  //! return success response

  return new NextResponse(null, { status: 200 });
}
