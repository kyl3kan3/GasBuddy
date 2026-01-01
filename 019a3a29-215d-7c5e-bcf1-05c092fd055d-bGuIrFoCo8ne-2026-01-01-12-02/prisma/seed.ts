import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test customer
  const customerPassword = await bcrypt.hash('password123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: customerPassword,
      name: 'John Customer',
      phone: '+1 (555) 123-4567',
      role: 'CUSTOMER',
    },
  });
  console.log('Created customer:', customer.email);

  // Create a test driver
  const driverPassword = await bcrypt.hash('password123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      email: 'driver@test.com',
      password: driverPassword,
      name: 'Mike Driver',
      phone: '+1 (555) 987-6543',
      role: 'DRIVER',
    },
  });
  console.log('Created driver:', driver.email);

  // Create driver profile
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      vehicleType: 'Fuel Truck',
      licensePlate: 'ABC-1234',
      licenseNumber: 'DL123456789',
      isAvailable: true,
      rating: 5.0,
      totalDeliveries: 0,
    },
  });
  console.log('Created driver profile');

  // Create a test admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Admin User',
      phone: '+1 (555) 000-0000',
      role: 'ADMIN',
    },
  });
  console.log('Created admin:', admin.email);

  console.log('Seeding completed!');
  console.log('');
  console.log('Test accounts:');
  console.log('Customer: customer@test.com / password123');
  console.log('Driver: driver@test.com / password123');
  console.log('Admin: admin@test.com / admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
