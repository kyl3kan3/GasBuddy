# GasRush - On-Demand Fuel Delivery Platform

A modern, full-stack web application for on-demand fuel delivery that connects customers with drivers in real-time.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="prisma+postgres://..."
   JWT_SECRET="your-secret-key-here"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

3. **Set Up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**

   Open [http://localhost:3000](http://localhost:3000) in your browser

## 👥 Test Accounts

Use these pre-configured accounts to explore different user roles:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Customer** | customer@test.com | password123 | Place orders, make payments, rate drivers |
| **Driver** | driver@test.com | password123 | Accept orders, update delivery status |
| **Admin** | admin@test.com | admin123 | View analytics, manage all orders |

## ✨ Key Features

### Customer Features
- **Order Fuel Delivery** - Choose fuel type (Regular, Plus, Premium, Diesel) and quantity
- **Interactive Map** - Select delivery location with drag-and-drop marker
- **Real-Time Tracking** - Monitor order status from placement to delivery
- **Secure Payments** - Stripe integration for safe card payments
- **Rate Drivers** - Provide feedback and ratings after delivery
- **Order Management** - Search, filter, and export order history to CSV
- **Toast Notifications** - Instant feedback for all actions

### Driver Features
- **Live Dashboard** - View all pending orders automatically refreshed every 10 seconds
- **One-Click Accept** - Accept orders instantly
- **Status Updates** - Update delivery progress (Assigned → In Progress → Delivered)
- **Navigation Links** - Direct integration with Google Maps
- **Earnings Tracking** - View your delivery history and customer ratings

### Admin Features
- **Analytics Dashboard** - Track total orders, revenue, active users
- **Order Management** - View and monitor all platform orders
- **Real-Time Metrics** - Auto-refreshing statistics every 30 seconds
- **Export Capabilities** - Download order data in CSV format

## 🎯 User Guide

### As a Customer

1. **Create Account**
   - Click "Sign up" on the homepage
   - Choose "Order Fuel" (Customer)
   - Enter your details and create a password

2. **Place an Order**
   - Click "Order Now" from the dashboard
   - Select your fuel type and quantity
   - Click on the map or drag the marker to set delivery location
   - Review your order summary and total
   - Click "Place Order"

3. **Make Payment**
   - Go to "My Orders" and click on your order
   - Click "Pay Now" to open Stripe checkout
   - Complete payment with test card: `4242 4242 4242 4242`
   - Use any future expiry date and any 3-digit CVC

4. **Track Delivery**
   - View real-time status updates on the order detail page
   - Receive toast notifications when status changes
   - See driver information once assigned

5. **Rate Your Driver**
   - After delivery is completed, click "Rate this driver"
   - Select 1-5 stars and optionally add a comment
   - Submit your rating

6. **Export Orders**
   - Go to "My Orders"
   - Use search and filters to find specific orders
   - Click "Export CSV" to download your order history

### As a Driver

1. **Register as Driver**
   - Click "Sign up" on the homepage
   - Choose "Deliver Fuel" (Driver)
   - Enter your details, vehicle info, and license information

2. **Accept Orders**
   - Access your driver dashboard
   - Review pending orders (updates every 10 seconds)
   - Click "Accept Order" on any available delivery
   - Click "View on Map" to get directions

3. **Update Delivery Status**
   - Go to the accepted order detail page
   - Click "Start Delivery" when heading to the location
   - Click "Mark as Delivered" when fuel is delivered

4. **View Your Performance**
   - Check your average rating on completed orders
   - View all your delivery history in "My Orders"

### As an Admin

1. **Access Admin Dashboard**
   - Log in with admin credentials
   - View platform-wide statistics
   - Monitor total orders, revenue, and user counts

2. **Manage Orders**
   - View all orders from all users
   - Filter by status, search by order number
   - Export complete order data to CSV

## 🔧 Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
- **React 19** - UI library with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with dark mode support
- **Leaflet.js** - Interactive maps for location selection

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database (Prisma Postgres)
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing (10 salt rounds)

### Integrations
- **Stripe** - Payment processing
- **Google Maps** - Navigation integration

## 📊 Database Schema

The application uses 6 main models:
- **User** - Customers, Drivers, and Admins
- **DriverProfile** - Driver-specific information and ratings
- **Order** - Fuel delivery orders
- **Location** - GPS coordinates for deliveries
- **Payment** - Stripe payment tracking
- **Rating** - Customer reviews of drivers

## 🔐 Security Features

- **Password Hashing** - bcrypt with 10 salt rounds
- **JWT Authentication** - Secure token-based auth with 7-day expiration
- **Role-Based Access Control** - Separate permissions for customers, drivers, and admins
- **Stripe Webhook Verification** - Secure payment confirmation
- **Protected API Routes** - Authorization required for all sensitive endpoints

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Orders
- `POST /api/orders` - Create order (customers)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/pending` - Get pending orders (drivers)
- `POST /api/orders/:id/accept` - Accept order (drivers)
- `PATCH /api/orders/:id/status` - Update order status

### Payments
- `POST /api/payments/checkout` - Create Stripe checkout session
- `POST /api/payments/webhook` - Handle Stripe webhooks

### Ratings
- `POST /api/ratings` - Submit driver rating

## 💡 Tips & Best Practices

1. **Test Payments** - Use Stripe test card `4242 4242 4242 4242` with any future date
2. **Real-Time Updates** - Orders auto-refresh, no need to manually reload
3. **Dark Mode** - Automatically adapts to your system preferences
4. **CSV Export** - Export orders while filters are active to get specific data
5. **Map Interaction** - Click anywhere on the map or drag the marker to set location

## 🐛 Troubleshooting

**Problem:** Dev server won't start
**Solution:** Delete `.next` folder and run `npm run dev` again

**Problem:** Database errors
**Solution:** Run `npx prisma generate && npx prisma db push`

**Problem:** Stripe webhooks not working
**Solution:** Check your `STRIPE_WEBHOOK_SECRET` in `.env` file

**Problem:** Map not loading
**Solution:** Ensure Leaflet CSS is included in `layout.tsx`

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Seed database with test data
npx prisma db seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🎨 Customization

### Fuel Prices
Edit prices in `/src/app/order/page.tsx`:
```typescript
const gasTypes = [
  { value: 'regular', label: 'Regular', price: 3.45 },
  { value: 'plus', label: 'Plus', price: 3.75 },
  // ...
];
```

### Service Fee
Modify in `/src/app/order/page.tsx`:
```typescript
const serviceFee = 4.99;
```

### Toast Duration
Change auto-dismiss time in `/src/contexts/ToastContext.tsx`:
```typescript
setTimeout(() => {
  setToasts(prev => prev.filter(toast => toast.id !== id));
}, 5000); // 5 seconds
```

## 📄 License

This project is for demonstration and educational purposes.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API endpoints documentation
3. Ensure all environment variables are set correctly
4. Verify test accounts are seeded in the database

---

Built with ❤️ using Next.js, React, and TypeScript
