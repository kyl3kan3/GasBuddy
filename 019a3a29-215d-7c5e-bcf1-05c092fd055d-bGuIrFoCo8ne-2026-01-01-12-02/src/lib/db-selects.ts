/**
 * Database Select Patterns
 *
 * Common Prisma select and include patterns to ensure consistency
 * across the application and reduce duplication.
 */

import { Prisma } from '@prisma/client';

/**
 * Common user select (excludes password)
 */
export const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/**
 * User select including driver profile (if exists)
 */
export const userWithDriverSelect = {
  ...userSelect,
  driverProfile: {
    select: {
      id: true,
      vehicleType: true,
      licensePlate: true,
      licenseNumber: true,
      rating: true,
      totalDeliveries: true,
      isAvailable: true,
    },
  },
} satisfies Prisma.UserSelect;

/**
 * Driver profile select
 */
export const driverProfileSelect = {
  id: true,
  userId: true,
  vehicleType: true,
  licensePlate: true,
  licenseNumber: true,
  isAvailable: true,
  rating: true,
  totalDeliveries: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DriverProfileSelect;

/**
 * Driver profile with user info
 */
export const driverWithUserSelect = {
  ...driverProfileSelect,
  user: {
    select: userSelect,
  },
} satisfies Prisma.DriverProfileSelect;

/**
 * Basic order select
 */
export const orderSelect = {
  id: true,
  orderNumber: true,
  customerId: true,
  deliveryAddress: true,
  deliveryLat: true,
  deliveryLng: true,
  gasType: true,
  quantity: true,
  pricePerUnit: true,
  totalAmount: true,
  status: true,
  driverId: true,
  orderDate: true,
  assignedAt: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

/**
 * Order with customer info
 */
export const orderWithCustomerSelect = {
  ...orderSelect,
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },
} satisfies Prisma.OrderSelect;

/**
 * Order with driver info
 */
export const orderWithDriverSelect = {
  ...orderSelect,
  driver: {
    select: {
      id: true,
      vehicleType: true,
      licensePlate: true,
      licenseNumber: true,
      rating: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

/**
 * Complete order with all relations
 */
export const orderWithAllRelationsSelect = {
  ...orderSelect,
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },
  driver: {
    select: {
      id: true,
      vehicleType: true,
      licensePlate: true,
      licenseNumber: true,
      rating: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      amount: true,
      status: true,
      paymentMethod: true,
      paidAt: true,
      createdAt: true,
    },
  },
  rating: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

/**
 * Payment select
 */
export const paymentSelect = {
  id: true,
  orderId: true,
  userId: true,
  amount: true,
  currency: true,
  status: true,
  stripePaymentId: true,
  stripeCustomerId: true,
  stripeSessionId: true,
  paymentMethod: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

/**
 * Rating select
 */
export const ratingSelect = {
  id: true,
  orderId: true,
  customerId: true,
  driverId: true,
  rating: true,
  comment: true,
  createdAt: true,
} satisfies Prisma.RatingSelect;

/**
 * Rating with customer and driver info
 */
export const ratingWithRelationsSelect = {
  ...ratingSelect,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  driver: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.RatingSelect;

/**
 * Location select
 */
export const locationSelect = {
  id: true,
  userId: true,
  orderId: true,
  latitude: true,
  longitude: true,
  accuracy: true,
  timestamp: true,
} satisfies Prisma.LocationSelect;

/**
 * Common order where clauses
 */
export const orderWhere = {
  byCustomer: (customerId: string): Prisma.OrderWhereInput => ({
    customerId,
  }),

  byDriver: (driverId: string): Prisma.OrderWhereInput => ({
    driverId,
  }),

  byStatus: (status: string): Prisma.OrderWhereInput => ({
    status: status as any,
  }),

  pending: (): Prisma.OrderWhereInput => ({
    status: 'PENDING',
  }),

  active: (): Prisma.OrderWhereInput => ({
    status: {
      in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
    },
  }),

  completed: (): Prisma.OrderWhereInput => ({
    status: 'DELIVERED',
  }),
};

/**
 * Common order includes (for include patterns instead of select)
 */
export const orderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },
  driver: {
    select: {
      id: true,
      vehicleType: true,
      licensePlate: true,
      licenseNumber: true,
      rating: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
  payment: true,
  rating: true,
} satisfies Prisma.OrderInclude;
