export type UserRole = 'customer' | 'driver' | 'admin';

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
  id: string;
  email: string;
  password: string; // In production, this would be hashed
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver extends User {
  role: 'driver';
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
  rating: number;
  completedDeliveries: number;
}

export interface Customer extends User {
  role: 'customer';
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'cash';
  last4?: string;
  cardBrand?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  driverId?: string;
  status: OrderStatus;
  gasAmount: number; // in gallons
  gasType: 'regular' | 'plus' | 'premium' | 'diesel';
  deliveryLocation: Address;
  vehicleLocation?: string; // Specific location description
  price: number;
  paymentStatus: PaymentStatus;
  paymentMethodId: string;
  scheduledTime?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  customer: Customer;
  driver?: Driver;
}

export interface AuthResponse {
  user: User | Customer | Driver;
  token: string;
}

export interface ApiError {
  error: string;
  message: string;
}
