import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getConnection } from '@/utils/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is missing');
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  let connection;
  try {
    connection = await getConnection();

    if (event.type === 'checkout.session.completed') {
      // Retrieve the subscription details
      await stripe.subscriptions.retrieve(session.subscription as string);
      const customerId = session.customer as string;
      
      // Update admin based on customer_id or metadata
      await connection.execute(
        `UPDATE admins 
         SET subscription_status = ?, subscription_plan = ?, stripe_customer_id = ? 
         WHERE id = ?`,
        ['active', 'pro', customerId, session.metadata?.adminId]
      );
    } 
    else if (event.type === 'customer.subscription.updated') {
      await connection.execute(
        `UPDATE admins 
         SET subscription_status = ? 
         WHERE stripe_customer_id = ?`,
        [subscription.status, subscription.customer as string]
      );
    }
    else if (event.type === 'customer.subscription.deleted') {
      await connection.execute(
        `UPDATE admins 
         SET subscription_status = ?, subscription_plan = ? 
         WHERE stripe_customer_id = ?`,
        ['canceled', 'free', subscription.customer as string]
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed', error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
