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

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only customers can create orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { gasType, quantity, deliveryLat, deliveryLng, deliveryAddress, pricePerUnit, totalAmount, notes } = body;

    if (!gasType || !quantity || !deliveryLat || !deliveryLng || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Missing fields', message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `GR${Date.now().toString().slice(-8)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        gasType,
        quantity: parseFloat(quantity.toString()),
        deliveryAddress,
        deliveryLat: parseFloat(deliveryLat.toString()),
        deliveryLng: parseFloat(deliveryLng.toString()),
        pricePerUnit: parseFloat(pricePerUnit.toString()),
        totalAmount: parseFloat(totalAmount.toString()),
        status: 'PENDING',
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
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while creating the order' },
      { status: 500 }
    );
  }
}

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
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      );
    }

    let orders;
    if (user.role === 'CUSTOMER') {
      orders = await prisma.order.findMany({
        where: { customerId: user.id },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          driver: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'DRIVER') {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!driverProfile) {
        return NextResponse.json({ orders: [] });
      }

      orders = await prisma.order.findMany({
        where: { driverId: driverProfile.id },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          driver: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await prisma.order.findMany({
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          driver: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while fetching orders' },
      { status: 500 }
    );
  }
}
