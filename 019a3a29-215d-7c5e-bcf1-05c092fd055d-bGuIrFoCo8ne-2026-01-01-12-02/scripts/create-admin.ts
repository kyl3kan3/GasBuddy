import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'kyl3kan3@gmail.com';
  const password = 'Admin@123'; // You can change this password
  const name = 'Kyle Kane';

  console.log(`Creating admin account for ${email}...`);

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update the admin user
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN', // Ensure role is ADMIN even if user exists
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
    console.log(`Password: ${password}`);
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
