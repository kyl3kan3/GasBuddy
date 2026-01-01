# GasRush - On-Demand Fuel Delivery Platform

A full-stack web application for on-demand fuel delivery, connecting customers with delivery drivers in real-time.

## 🚀 Live Application

**Access the app at:** `http://localhost:3001`

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Customer** | customer@test.com | password123 |
| **Driver** | driver@test.com | password123 |
| **Admin** | admin@test.com | admin123 |

---

## ✨ Features

### For Customers
- **User Registration & Authentication** - Secure account creation with bcrypt password hashing
- **Interactive Order Placement** - Select fuel type, quantity, and delivery location on a map
- **Real-Time Location Selection** - Drag-and-drop marker or click to set delivery location
- **Order Tracking** - Monitor order status in real-time
- **Payment Integration** - Secure Stripe checkout for card payments
- **Driver Rating System** - Rate drivers after delivery completion
- **Order History** - View all past and current orders

### For Drivers
- **Driver Dashboard** - View available delivery orders in real-time
- **Accept Orders** - One-click to accept pending orders
- **Order Management** - Update order status (In Progress → Delivered)
- **Navigation Integration** - Direct links to Google Maps for route navigation
- **Earnings Tracking** - View completed deliveries and ratings

### For Admins
- **Admin Dashboard** - Comprehensive platform overview
- **Analytics** - Total orders, revenue, active drivers, customers
- **Order Management** - View and manage all orders
- **User Management** - Monitor customer and driver activity
- **Real-Time Metrics** - Auto-refreshing statistics

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Leaflet.js** - Interactive maps
- **React-Leaflet** - React wrapper for Leaflet

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing

### Payment & Services
- **Stripe** - Payment processing
- **Google Maps API** - Navigation integration

---

## 📁 Project Structure

```
/src
├── /app
│   ├── /api                    # API Routes
│   │   ├── /auth              # Authentication endpoints
│   │   ├── /orders            # Order management
│   │   ├── /payments          # Stripe integration
│   │   └── /ratings           # Rating system
│   ├── /admin                 # Admin dashboard
│   ├── /driver                # Driver dashboard
│   ├── /login                 # Login page
│   ├── /order                 # Order placement form
│   ├── /orders                # Order tracking & history
│   ├── /register              # Registration page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── /components                # Reusable components
│   ├── MapPicker.tsx          # Interactive map selector
│   └── Navbar.tsx             # Navigation bar
├── /contexts                  # React contexts
│   └── AuthContext.tsx        # Auth state management
├── /lib                       # Utilities
│   ├── jwt.ts                 # JWT helpers
│   └── prisma.ts              # Prisma client
└── /types                     # TypeScript types
    └── index.ts

/prisma
├── schema.prisma              # Database schema
├── seed.ts                    # Test data seeder
└── /migrations                # Database migrations
```

---

## 🗄️ Database Schema

### Core Models
- **User** - Customers, Drivers, and Admins
- **DriverProfile** - Vehicle info, ratings, availability
- **Order** - Delivery orders with status tracking
- **Payment** - Stripe payment records
- **Rating** - Driver ratings and reviews
- **Location** - GPS tracking history

### Order Status Flow
```
PENDING → ASSIGNED → IN_PROGRESS → DELIVERED
                ↓
            CANCELLED
```

---

## 🔐 Security Features

- **Password Hashing** - bcrypt with 10 salt rounds
- **JWT Authentication** - 7-day token expiration
- **Role-Based Access Control** - Customer, Driver, Admin permissions
- **API Route Protection** - Token verification on all protected endpoints
- **SQL Injection Prevention** - Prisma's parameterized queries
- **XSS Protection** - React's built-in escaping

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user

### Orders
- `POST /api/orders` - Create new order (Customer)
- `GET /api/orders` - List user's orders
- `GET /api/orders/pending` - Get unassigned orders (Driver)
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders/[id]/accept` - Accept order (Driver)
- `PATCH /api/orders/[id]/status` - Update order status

### Payments
- `POST /api/payments/checkout` - Create Stripe checkout session
- `POST /api/payments/webhook` - Stripe webhook handler

### Ratings
- `POST /api/ratings` - Submit driver rating (Customer)

---

## 💳 Stripe Payment Integration

### Setup
1. Get your Stripe keys from [stripe.com/dashboard](https://dashboard.stripe.com)
2. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Configuration
For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

### Payment Flow
1. Customer places order
2. System creates Stripe Checkout Session
3. Customer completes payment on Stripe
4. Webhook confirms payment
5. Order status updates to "paid"

---

## 🧪 Testing Workflow

### As Customer
1. Register/Login as customer
2. Go to "Order Fuel"
3. Select fuel type (Regular/Plus/Premium/Diesel)
4. Set quantity (5-50 gallons)
5. Click map to set delivery location
6. Submit order
7. Wait for driver to accept
8. Track order status
9. Rate driver after delivery

### As Driver
1. Register/Login as driver
2. View available orders on dashboard
3. Click "Accept Order"
4. Update status to "In Progress"
5. Complete delivery
6. Mark as "Delivered"

### As Admin
1. Login as admin
2. View dashboard metrics
3. Monitor all orders
4. Manage platform activity

---

## 🚀 Development

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL (via Prisma Postgres)

### Installation
```bash
npm install
```

### Database Setup
```bash
# Start Prisma Postgres
npx prisma dev

# Run migrations
npx prisma db push

# Seed test data
npx tsx prisma/seed.ts

# Generate Prisma Client
npx prisma generate
```

### Start Development Server
```bash
npm run dev
```

Application runs on: `http://localhost:3001`

---

## 📝 Environment Variables

Create a `.env` file:
```env
# Database
DATABASE_URL="prisma+postgres://localhost:51213/..."

# Auth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Maps (Optional)
NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_token"
NEXT_PUBLIC_GOOGLE_MAPS_KEY="your_google_maps_key"
```

---

## 🎯 Key Features Implemented

### ✅ Core Functionality
- [x] User authentication (JWT + bcrypt)
- [x] Role-based access (Customer/Driver/Admin)
- [x] Order placement with map
- [x] Real-time order tracking
- [x] Driver assignment system
- [x] Order status transitions
- [x] GPS location tracking

### ✅ Payments
- [x] Stripe checkout integration
- [x] Webhook payment confirmation
- [x] Payment status tracking
- [x] Automatic receipt generation

### ✅ Ratings
- [x] 5-star rating system
- [x] Driver rating calculation
- [x] Rating comments
- [x] Historical ratings

### ✅ Admin Features
- [x] Dashboard with metrics
- [x] Order management
- [x] User statistics
- [x] Revenue tracking

---

## 🔧 Configuration

### Fuel Types & Pricing
Edit in `/src/app/order/page.tsx`:
```typescript
const gasTypes = [
  { value: 'regular', label: 'Regular', price: 3.45 },
  { value: 'plus', label: 'Plus', price: 3.75 },
  { value: 'premium', label: 'Premium', price: 4.05 },
  { value: 'diesel', label: 'Diesel', price: 4.25 },
];
```

### Service Fee
Edit in `/src/app/order/page.tsx`:
```typescript
const serviceFee = 4.99;
```

---

## 📈 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Email confirmations
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Route optimization
- [ ] Scheduled deliveries
- [ ] Recurring orders

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Restart Prisma Postgres
pkill -f prisma
npx prisma dev
```

### Port Already in Use
```bash
# Kill process on port 3000/3001
npx kill-port 3001
```

### Missing Dependencies
```bash
npm install
npx prisma generate
```

---

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ⚡ by Claude Code**
