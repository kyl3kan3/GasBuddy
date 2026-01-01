import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only drivers can accept orders' },
        { status: 403 }
      );
    }

    // Get driver profile
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!driverProfile) {
      return NextResponse.json(
        { error: 'Not found', message: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Check if order exists and is pending
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'PENDING' || order.driverId) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Order is no longer available' },
        { status: 409 }
      );
    }

    // Accept the order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        driverId: driverProfile.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Accept order error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while accepting the order' },
      { status: 500 }
    );
  }
}
