# Admin Account Setup Guide

## Your Admin Account Details

**Email:** kyl3kan3@gmail.com
**Temporary Password:** Admin@123
**Name:** Kyle Kane

⚠️ **IMPORTANT:** Change this password immediately after your first login!

---

## Setup Instructions

### Option 1: If Database is Already Running

If your database is already configured and the app is running:

```bash
# Run the admin creation script
npm run create-admin
```

### Option 2: Fresh Database Setup

If you need to set up the database from scratch:

1. **Create a `.env` file in the project root:**

```env
# Database - Use your actual Prisma Postgres connection string
DATABASE_URL="your-prisma-postgres-connection-string"

# JWT Secret - Generate a random string
JWT_SECRET="your-secret-key-at-least-32-characters-long"

# Stripe (Optional for testing without payments)
STRIPE_SECRET_KEY="sk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key"
```

2. **Set up the database:**

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test accounts (includes default admin)
npx prisma db seed

# Create your admin account
npm run create-admin
```

3. **Start the development server:**

```bash
npm run dev
```

---

## Existing Test Accounts

The seed also creates these test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Customer** | customer@test.com | password123 |
| **Driver** | driver@test.com | password123 |
| **Admin** | admin@test.com | admin123 |

---

## How to Access Admin Dashboard

1. Go to http://localhost:3000 (or your deployed URL)
2. Click "Sign In"
3. Enter your admin credentials:
   - Email: `kyl3kan3@gmail.com`
   - Password: `Admin@123`
4. You'll be redirected to the admin dashboard at `/admin`

---

## Admin Dashboard Features

As an admin, you have access to:

- **Analytics Dashboard** - View total orders, revenue, active drivers, and customers
- **Order Management** - View and monitor all orders across the platform
- **Real-Time Metrics** - Auto-refreshing statistics every 30 seconds
- **Export Data** - Download order data in CSV format
- **User Overview** - Monitor customer and driver activity

---

## Changing Your Password

Currently, there's no password change UI. To change your password:

### Method 1: Using Prisma Studio (Recommended)

```bash
npx prisma studio
```

Then:
1. Open the User table
2. Find your user (kyl3kan3@gmail.com)
3. Click to edit
4. Replace the `password` field with a new bcrypt hash

### Method 2: Using a Script

Create a new password hash:

```javascript
const bcrypt = require('bcryptjs');
const newPassword = 'your-new-password';
const hash = bcrypt.hashSync(newPassword, 10);
console.log('New hash:', hash);
```

Then update it in Prisma Studio or directly in the database.

---

## Troubleshooting

**Problem:** "Missing required environment variable: DATABASE_URL"
**Solution:** Create a `.env` file with your DATABASE_URL as shown above

**Problem:** Script fails with connection error
**Solution:** Ensure your Prisma Postgres instance is running and the connection string is correct

**Problem:** Admin account already exists
**Solution:** The script uses `upsert`, so it will update the existing account if it exists

**Problem:** Can't access /admin page
**Solution:** Ensure you're logged in with an account that has `role: 'ADMIN'`

---

## Security Notes

1. **Change the default password immediately** after first login
2. Store your admin credentials securely (use a password manager)
3. Never commit `.env` files to version control
4. Use strong, unique passwords for production environments
5. Enable two-factor authentication if deploying to production

---

## Need Help?

- Check the main README.md for general setup instructions
- Review API documentation for technical details
- Ensure all environment variables are properly configured
