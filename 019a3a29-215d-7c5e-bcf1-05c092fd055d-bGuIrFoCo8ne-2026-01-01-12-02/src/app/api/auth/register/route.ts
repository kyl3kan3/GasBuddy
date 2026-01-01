import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, vehicleType, licensePlate, licenseNumber } = body;

    if (!email || !password || !name || !phone || !role) {
      return NextResponse.json(
        { error: 'Missing fields', message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User exists', message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert role to uppercase for Prisma enum
    const userRole = role.toUpperCase() as 'CUSTOMER' | 'DRIVER' | 'ADMIN';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: userRole,
      },
    });

    // If driver, create driver profile
    if (role === 'driver' && vehicleType && licensePlate) {
      await prisma.driverProfile.create({
        data: {
          userId: user.id,
          vehicleType,
          licensePlate,
          licenseNumber: licenseNumber || '',
        },
      });
    }

    // Create JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role.toLowerCase(),
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to register user' },
      { status: 500 }
    );
  }
}
