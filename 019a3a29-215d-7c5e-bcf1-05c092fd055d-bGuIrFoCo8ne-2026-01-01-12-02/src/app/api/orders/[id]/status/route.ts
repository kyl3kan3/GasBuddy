import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(
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
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing fields', message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status transitions
    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status', message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        driver: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'CUSTOMER') {
      // Customers can only cancel their own pending orders
      if (order.customerId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only update your own orders' },
          { status: 403 }
        );
      }
      if (status !== 'CANCELLED' || order.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Customers can only cancel pending orders' },
          { status: 403 }
        );
      }
    } else if (user.role === 'DRIVER') {
      // Drivers can only update their assigned orders
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!driverProfile || order.driverId !== driverProfile.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only update your assigned orders' },
          { status: 403 }
        );
      }

      // Validate status transitions for drivers
      if (order.status === 'ASSIGNED' && status !== 'IN_PROGRESS' && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Invalid transition', message: 'Can only start or cancel assigned orders' },
          { status: 400 }
        );
      }
      if (order.status === 'IN_PROGRESS' && status !== 'DELIVERED') {
        return NextResponse.json(
          { error: 'Invalid transition', message: 'Can only complete orders in progress' },
          { status: 400 }
        );
      }
    }
    // Admins can update any order to any status

    // Update order
    const updateData: any = { status };

    if (status === 'IN_PROGRESS' && !order.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'DELIVERED' && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
