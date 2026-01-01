'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface Order {
  id: string;
  orderNumber: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  gasType: string;
  quantity: number;
  totalAmount: number;
  status: string;
  customer: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      router.push('/');
      return;
    }

    fetchPendingOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, [user, token]);

  const fetchPendingOrders = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/orders/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;

    setAcceptingOrder(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept order');
      }

      // Remove the accepted order from the list
      setOrders(prev => prev.filter(order => order.id !== orderId));
      showToast('Order accepted successfully!', 'success');

      // Redirect to the order tracking page
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to accept order', 'error');
    } finally {
      setAcceptingOrder(null);
    }
  };

  if (!user || user.role !== 'driver') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Driver Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Available delivery orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              No orders available
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              New delivery requests will appear here automatically
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Customer</p>
                    <p className="text-zinc-900 dark:text-white font-medium">
                      {order.customer.name}
                    </p>
                    {order.customer.phone && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {order.customer.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Delivery Location</p>
                    <p className="text-zinc-900 dark:text-white">
                      {order.deliveryAddress}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Fuel Type</p>
                      <p className="text-zinc-900 dark:text-white font-medium capitalize">
                        {order.gasType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Quantity</p>
                      <p className="text-zinc-900 dark:text-white font-medium">
                        {order.quantity} gal
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Amount</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={acceptingOrder === order.id}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
                >
                  {acceptingOrder === order.id ? 'Accepting...' : 'Accept Order'}
                </button>

                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`, '_blank')}
                  className="w-full mt-2 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  View on Map
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
