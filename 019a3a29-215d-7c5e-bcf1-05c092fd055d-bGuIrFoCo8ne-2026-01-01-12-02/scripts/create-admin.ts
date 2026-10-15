import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';
  if (!email || !password || password.length < 16) {
    throw new Error('Set ADMIN_EMAIL and a random ADMIN_PASSWORD of at least 16 characters');
  }

  console.log(`Creating admin account for ${email}...`);

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update the admin user
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword, // Rotate an existing account instead of preserving a known password.
      },
      create: {
        email,
        password: hashedPassword,
        name,
        phone: '+1 (555) 123-0000', // Optional: you can change this
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('Admin Login Credentials:');
    console.log(`Email: ${email}`);
    console.log('Password supplied through ADMIN_PASSWORD; it is not logged.');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
