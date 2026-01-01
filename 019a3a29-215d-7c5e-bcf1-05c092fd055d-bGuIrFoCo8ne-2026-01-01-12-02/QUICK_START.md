# 🚀 Quick Start Guide for Kyle

## Current Status

✅ `.env` file created with JWT_SECRET
✅ Admin creation script ready
✅ Setup script created
⏳ Database connection needed

---

## Step 1: Set Up Your Database (Choose One)

### Option A: Prisma Postgres (Fastest)

```bash
# Install Prisma Postgres CLI globally
npm install -g prisma-postgres

# Start Prisma Postgres
npx prisma-postgres
```

This will give you a connection string like:
```
prisma+postgres://accelerate.prisma-data.net/?api_key=ey...
```

Copy this and update line 13 in `.env`:
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY_HERE"
```

### Option B: Free Cloud Database (Easiest)

**Using Neon (Recommended):**
1. Go to https://neon.tech
2. Sign up for free
3. Create a new project
4. Copy the connection string
5. Paste it into `.env` on line 13

**Using Supabase:**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI mode)
5. Paste it into `.env` on line 13

### Option C: Local PostgreSQL

If you have PostgreSQL installed locally:
```bash
# Create database
createdb gasrush

# Update .env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/gasrush"
```

---

## Step 2: Run the Setup

### On Mac/Linux:
```bash
./setup.sh
```

### On Windows or if bash doesn't work:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data
npx prisma db seed

# Create your admin account
npm run create-admin
```

---

## Step 3: Start the Application

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 4: Login as Admin

**Your Credentials:**
- Email: `kyl3kan3@gmail.com`
- Password: `Admin@123`

**Other Test Accounts:**
- Customer: `customer@test.com` / `password123`
- Driver: `driver@test.com` / `password123`
- Admin: `admin@test.com` / `admin123`

---

## 🎯 What You Can Do as Admin

1. **View Analytics Dashboard** - See total orders, revenue, active users
2. **Manage All Orders** - View orders from all customers and drivers
3. **Export Data** - Download order data in CSV format
4. **Monitor Platform** - Real-time metrics that auto-refresh

---

## 🔧 Troubleshooting

**Error: "Missing required environment variable: DATABASE_URL"**
→ Edit `.env` file and set a valid DATABASE_URL

**Error: Connection refused**
→ Check your database is running and the connection string is correct

**Error: Admin account already exists**
→ That's okay! You can login with the existing credentials

**Can't access /admin page**
→ Make sure you're logged in with an admin account

---

## 📞 Need Help?

- Check `ADMIN_SETUP.md` for detailed instructions
- Check `README.md` for full documentation
- Ensure your `.env` file has a valid DATABASE_URL

---

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Choose a database option and update DATABASE_URL in .env
# 2. Run setup:
./setup.sh

# 3. Start the app:
npm run dev

# 4. Login:
# Go to http://localhost:3000
# Email: kyl3kan3@gmail.com
# Password: Admin@123
```
