import { User, Customer, Driver, Order, OrderWithDetails } from '@/types';

// Mock database using in-memory storage
// In production, replace with PostgreSQL, MongoDB, etc.

class MockDatabase {
  private users: Map<string, User | Customer | Driver> = new Map();
  private orders: Map<string, Order> = new Map();
  private sessions: Map<string, string> = new Map(); // token -> userId

  constructor() {
    // Seed with some initial data
    this.seedData();
  }

  private seedData() {
    // Add a test customer
    const customer: Customer = {
      id: 'customer-1',
      email: 'customer@example.com',
      password: 'password123', // In production: use bcrypt
      name: 'John Doe',
      phone: '+1234567890',
      role: 'customer',
      addresses: [
        {
          id: 'addr-1',
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          isDefault: true,
        },
      ],
      paymentMethods: [
        {
          id: 'pm-1',
          type: 'card',
          last4: '4242',
          cardBrand: 'Visa',
          isDefault: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(customer.id, customer);

    // Add a test driver
    const driver: Driver = {
      id: 'driver-1',
      email: 'driver@example.com',
      password: 'password123',
      name: 'Jane Smith',
      phone: '+1234567891',
      role: 'driver',
      vehicleInfo: {
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        licensePlate: 'ABC123',
      },
      isAvailable: true,
      rating: 4.8,
      completedDeliveries: 127,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(driver.id, driver);

    // Add admin user
    const admin: User = {
      id: 'admin-1',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      phone: '+1234567892',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(admin.id, admin);
  }

  // Auth methods
  async login(email: string, password: string): Promise<User | Customer | Driver | null> {
    for (const user of this.users.values()) {
      if (user.email === email && user.password === password) {
        return user;
      }
    }
    return null;
  }

  async register(userData: Partial<User | Customer | Driver>): Promise<User | Customer | Driver> {
    const id = `${userData.role}-${Date.now()}`;
    const user = {
      ...userData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User | Customer | Driver;

    this.users.set(id, user);
    return user;
  }

  createSession(userId: string): string {
    const token = `token-${Date.now()}-${Math.random().toString(36)}`;
    this.sessions.set(token, userId);
    return token;
  }

  getUserByToken(token: string): User | Customer | Driver | null {
    const userId = this.sessions.get(token);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  // User methods
  async getUserById(id: string): Promise<User | Customer | Driver | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User | Customer | Driver>): Promise<User | Customer | Driver | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.users.values()).filter(
      (user): user is Driver => user.role === 'driver'
    );
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.users.values()).filter(
      (user): user is Driver => user.role === 'driver' && user.isAvailable
    );
  }

  // Order methods
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const id = `order-${Date.now()}`;
    const order: Order = {
      ...orderData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async getOrderWithDetails(id: string): Promise<OrderWithDetails | null> {
    const order = this.orders.get(id);
    if (!order) return null;

    const customer = this.users.get(order.customerId) as Customer;
    const driver = order.driverId ? (this.users.get(order.driverId) as Driver) : undefined;

    return {
      ...order,
      customer,
      driver,
    };
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.customerId === customerId
    );
  }

  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.driverId === driverId
    );
  }

  async getPendingOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === 'pending'
    );
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;

    const updated = { ...order, ...updates, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async acceptOrder(orderId: string, driverId: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      driverId,
      status: 'accepted',
      acceptedAt: new Date(),
    });
  }

  async completeOrder(orderId: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      status: 'completed',
      completedAt: new Date(),
      paymentStatus: 'completed',
    });
  }

  async cancelOrder(orderId: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });
  }
}

// Export singleton instance
export const db = new MockDatabase();
