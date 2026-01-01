import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(
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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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

    if (!order) {
      return NextResponse.json(
        { error: 'Not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedOrder = {
      ...order,
      driver: order.driver ? {
        name: order.driver.user.name,
        phone: order.driver.user.phone,
        vehicleType: order.driver.vehicleType,
        licensePlate: order.driver.licensePlate,
      } : undefined,
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while fetching the order' },
      { status: 500 }
    );
  }
}
