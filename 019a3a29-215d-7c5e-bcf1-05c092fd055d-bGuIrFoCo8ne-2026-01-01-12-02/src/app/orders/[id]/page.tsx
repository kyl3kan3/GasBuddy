'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DriverLocationTracker from '@/components/DriverLocationTracker';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import L from 'leaflet';

interface OrderDetails {
  id: string;
  orderNumber: string;
  gasType: string;
  quantity: number;
  totalAmount: number;
  pricePerUnit: number;
  status: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  createdAt: string;
  completedAt?: string;
  customer: {
    name: string;
    phone: string;
  };
  driver?: {
    name: string;
    phone: string;
    vehicleType: string;
    licensePlate: string;
    rating?: number;
  };
  payment?: {
    status: string;
    paidAt?: string;
  };
  rating?: {
    rating: number;
    comment?: string;
  };
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Rating state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [params.id, user, token]);

  useEffect(() => {
    if (!isClient || !order) return;

    if (!mapRef.current) {
      const map = L.map('tracking-map').setView([order.deliveryLat, order.deliveryLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([order.deliveryLat, order.deliveryLng], {
        icon: customIcon
      }).addTo(map);

      marker.bindPopup('Delivery Location').openPopup();
      markerRef.current = marker;
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isClient, order]);

  const fetchOrder = async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!token || !order) return;

    setIsProcessingPayment(true);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process payment', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !order) return;

    setIsSubmittingRating(true);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment: ratingComment || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }

      // Refresh order to show rating
      await fetchOrder();
      setShowRatingForm(false);
      setRatingComment('');
      showToast('Rating submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit rating', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !order) return;

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      await fetchOrder();
      showToast('Order status updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'assigned':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
            {error || 'Order not found'}
          </h2>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canPay = user?.role === 'customer' && order.status !== 'CANCELLED' &&
                 (!order.payment || order.payment.status !== 'COMPLETED');
  const canRate = user?.role === 'customer' && order.status === 'DELIVERED' && !order.rating;
  const canUpdateStatus = user?.role === 'driver' && ['ASSIGNED', 'IN_PROGRESS'].includes(order.status);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/orders')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Orders
          </button>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Driver Location Tracker - for drivers only */}
        {user?.role === 'driver' && order.status === 'IN_PROGRESS' && (
          <DriverLocationTracker orderId={order.id} isActive={true} />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Tracking Map or Static Map */}
          <div className="lg:col-span-2">
            {order.driver && ['ASSIGNED', 'IN_PROGRESS', 'DELIVERED'].includes(order.status) ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Live Tracking
                </h2>
                <LiveTrackingMap orderId={order.id} />
              </div>
            ) : isClient ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Delivery Location
                </h2>
                <div id="tracking-map" className="w-full h-96 rounded-lg" />
              </div>
            ) : null}
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Order Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Fuel Type</p>
                  <p className="text-zinc-900 dark:text-white font-medium capitalize">
                    {order.gasType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Quantity</p>
                  <p className="text-zinc-900 dark:text-white font-medium">
                    {order.quantity} gallons
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Price per Gallon</p>
                  <p className="text-zinc-900 dark:text-white font-medium">
                    ${order.pricePerUnit.toFixed(2)}
                  </p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Amount</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {user?.role === 'customer' && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Payment
                </h2>
                {order.payment?.status === 'COMPLETED' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Payment Completed
                      </span>
                    </div>
                    {order.payment.paidAt && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Paid on {new Date(order.payment.paidAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : canPay ? (
                  <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Complete payment to confirm your order
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessingPayment ? 'Processing...' : 'Pay Now with Stripe'}
                    </button>
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {order.payment?.status || 'Payment pending'}
                  </p>
                )}
              </div>
            )}

            {/* Driver Status Controls */}
            {canUpdateStatus && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Update Status
                </h2>
                <div className="space-y-3">
                  {order.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                      disabled={isUpdatingStatus}
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-zinc-400 transition-colors"
                    >
                      Start Delivery
                    </button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusUpdate('DELIVERED')}
                      disabled={isUpdatingStatus}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-zinc-400 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Rating Section */}
            {canRate && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Rate Your Experience
                </h2>
                {!showRatingForm ? (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    Rate Driver
                  </button>
                ) : (
                  <form onSubmit={handleRatingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Rating
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-3xl ${
                              star <= rating ? 'text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Share your experience..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRatingForm(false)}
                        className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRating}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-zinc-400"
                      >
                        {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Show existing rating */}
            {order.rating && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Your Rating
                </h2>
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= order.rating!.rating ? 'text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {order.rating.comment && (
                    <p className="text-zinc-600 dark:text-zinc-400 italic">
                      "{order.rating.comment}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Customer/Driver Info */}
            {user?.role === 'driver' && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Customer Information
                </h2>
                <div className="space-y-2">
                  <p className="text-zinc-900 dark:text-white font-medium">
                    {order.customer.name}
                  </p>
                  {order.customer.phone && (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="block text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {order.customer.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {user?.role === 'customer' && order.driver && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  Driver Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-zinc-900 dark:text-white font-medium text-lg">
                      {order.driver.name}
                    </p>
                    {order.driver.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {order.driver.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {order.driver.phone && (
                      <a
                        href={`tel:${order.driver.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {order.driver.phone}
                      </a>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Vehicle</p>
                    <p className="text-zinc-900 dark:text-white">
                      {order.driver.vehicleType} • {order.driver.licensePlate}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Delivery Address
              </h2>
              <p className="text-zinc-900 dark:text-white mb-4">{order.deliveryAddress}</p>
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`, '_blank')}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
