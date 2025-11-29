import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';

interface Admin extends RowDataPacket {
  id: number;
  username: string;
  stripe_customer_id: string | null;
}

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { username } = await req.json(); // In a real app, get this from session/auth

    if (!username) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    connection = await getConnection();
    const [admins] = await connection.execute<Admin[]>(
      'SELECT id, username, stripe_customer_id FROM admins WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    const admin = admins[0];
    let customerId = admin.stripe_customer_id;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          adminId: admin.id.toString(),
          username: admin.username,
        },
      });
      customerId = customer.id;

      await connection.execute(
        'UPDATE admins SET stripe_customer_id = ? WHERE id = ?',
        [customerId, admin.id]
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Ensure this is set in .env
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${req.nextUrl.origin}/admin/subscription?success=true`,
      cancel_url: `${req.nextUrl.origin}/admin/subscription?canceled=true`,
      metadata: {
        adminId: admin.id.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
