#!/bin/bash

echo "================================================"
echo "   GasRush Database Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
source .env 2>/dev/null
if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"YOUR_API_KEY"* ]] || [[ "$DATABASE_URL" == *"username:password"* ]]; then
    echo "⚠️  DATABASE_URL is not properly configured in .env"
    echo ""
    echo "Choose your database option:"
    echo ""
    echo "OPTION 1: Prisma Postgres (Recommended)"
    echo "  1. Install: npm install -g prisma-postgres"
    echo "  2. Run: npx prisma-postgres"
    echo "  3. Copy the connection string to .env DATABASE_URL"
    echo ""
    echo "OPTION 2: Local PostgreSQL"
    echo "  1. Install PostgreSQL: https://www.postgresql.org/download/"
    echo "  2. Create database: createdb gasrush"
    echo "  3. Update .env: DATABASE_URL=\"postgresql://postgres:password@localhost:5432/gasrush\""
    echo ""
    echo "OPTION 3: Hosted PostgreSQL"
    echo "  - Neon: https://neon.tech (Free tier available)"
    echo "  - Supabase: https://supabase.com (Free tier available)"
    echo "  - Railway: https://railway.app (Free tier available)"
    echo ""
    echo "After configuring DATABASE_URL, run this script again."
    exit 1
fi

echo "✅ .env file found"
echo "✅ DATABASE_URL is configured"
echo ""

echo "Step 1: Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi
echo "✅ Prisma Client generated"
echo ""

echo "Step 2: Pushing schema to database..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema to database"
    echo "Please check your DATABASE_URL and database connection"
    exit 1
fi
echo "✅ Schema pushed to database"
echo ""

echo "Step 3: Seeding database with test accounts..."
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "⚠️  Seeding failed (this is okay if accounts already exist)"
else
    echo "✅ Database seeded successfully"
fi
echo ""

echo "Step 4: Creating your admin account..."
npm run create-admin
if [ $? -ne 0 ]; then
    echo "⚠️  Admin creation failed (account may already exist)"
else
    echo "✅ Admin account created"
fi
echo ""

echo "================================================"
echo "   Setup Complete! 🎉"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Login with: kyl3kan3@gmail.com / Admin@123"
echo ""
echo "Test accounts:"
echo "  Customer: customer@test.com / password123"
echo "  Driver: driver@test.com / password123"
echo "  Admin: admin@test.com / admin123"
echo ""
