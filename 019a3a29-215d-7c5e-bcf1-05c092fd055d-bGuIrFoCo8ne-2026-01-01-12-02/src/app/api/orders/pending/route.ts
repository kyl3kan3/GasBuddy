import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
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
        { error: 'Forbidden', message: 'Only drivers can view pending orders' },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        driverId: null,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get pending orders error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while fetching pending orders' },
      { status: 500 }
    );
  }
}
