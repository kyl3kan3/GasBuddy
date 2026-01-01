import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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
    const { orderId, rating, comment } = body;

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: 'Missing fields', message: 'Order ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating', message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        rating: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user is the customer
    if (order.customerId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only rate your own orders' },
        { status: 403 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Invalid status', message: 'You can only rate delivered orders' },
        { status: 400 }
      );
    }

    // Check if already rated
    if (order.rating) {
      return NextResponse.json(
        { error: 'Already rated', message: 'This order has already been rated' },
        { status: 400 }
      );
    }

    // Check if order has a driver
    if (!order.driverId) {
      return NextResponse.json(
        { error: 'No driver', message: 'This order has no driver assigned' },
        { status: 400 }
      );
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        orderId: order.id,
        customerId: payload.userId,
        driverId: order.driverId,
        rating: parseInt(rating.toString()),
        comment: comment || null,
      },
    });

    // Update driver's average rating
    const driverRatings = await prisma.rating.findMany({
      where: { driverId: order.driverId },
      select: { rating: true },
    });

    const avgRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;

    await prisma.driverProfile.update({
      where: { id: order.driverId },
      data: {
        rating: avgRating,
        totalDeliveries: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ rating: newRating }, { status: 201 });
  } catch (error: any) {
    console.error('Create rating error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to create rating' },
      { status: 500 }
    );
  }
}
