import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing fields', message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order
    if (order.customerId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only pay for your own orders' },
        { status: 403 }
      );
    }

    // Check if payment already exists and is completed
    if (order.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Already paid', message: 'This order has already been paid' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fuel Delivery - Order #${order.orderNumber}`,
              description: `${order.quantity} gallons of ${order.gasType} fuel`,
            },
            unit_amount: Math.round(order.totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/orders/${orderId}?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/orders/${orderId}?payment=cancelled`,
      customer_email: order.customer.email,
      metadata: {
        orderId: order.id,
        userId: payload.userId,
      },
    });

    // Create or update payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          stripeSessionId: session.id,
          status: 'PENDING',
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: payload.userId,
          amount: order.totalAmount,
          stripeSessionId: session.id,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
