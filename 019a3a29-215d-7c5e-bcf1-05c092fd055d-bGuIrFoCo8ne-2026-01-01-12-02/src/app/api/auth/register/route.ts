import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { publicRegistrationRole } from '@/lib/security-policy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, vehicleType, licensePlate, licenseNumber } = body;
    const userRole = publicRegistrationRole(role);
    if (!userRole) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (userRole === 'DRIVER' && (!vehicleType || !licensePlate)) {
      return NextResponse.json({ error: 'Driver vehicle details are required' }, { status: 400 });
    }

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
    if (userRole === 'DRIVER') {
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
