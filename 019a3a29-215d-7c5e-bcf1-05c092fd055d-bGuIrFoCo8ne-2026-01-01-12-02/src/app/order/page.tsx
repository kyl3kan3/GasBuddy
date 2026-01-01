'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import MapPicker from '@/components/MapPicker';

export default function OrderPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    gasType: 'regular',
    quantity: 10,
    deliveryLat: 0,
    deliveryLng: 0,
    deliveryAddress: '',
    notes: '',
  });

  const gasTypes = [
    { value: 'regular', label: 'Regular', price: 3.45 },
    { value: 'plus', label: 'Plus', price: 3.75 },
    { value: 'premium', label: 'Premium', price: 4.05 },
    { value: 'diesel', label: 'Diesel', price: 4.25 },
  ];

  const selectedGasType = gasTypes.find(g => g.value === formData.gasType);
  const totalPrice = selectedGasType ? selectedGasType.price * formData.quantity : 0;
  const serviceFee = 4.99;
  const grandTotal = totalPrice + serviceFee;

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      deliveryLat: lat,
      deliveryLng: lng,
      deliveryAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deliveryLat || !formData.deliveryLng) {
      showToast('Please select a delivery location on the map', 'error');
      return;
    }

    if (!user || !token) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gasType: formData.gasType,
          quantity: formData.quantity,
          deliveryLat: formData.deliveryLat,
          deliveryLng: formData.deliveryLng,
          deliveryAddress: formData.deliveryAddress,
          pricePerUnit: selectedGasType?.price,
          totalAmount: grandTotal,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      showToast('Order placed successfully!', 'success');
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
            Please log in to place an order
          </h2>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role === 'driver') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
            Drivers cannot place orders
          </h2>
          <button
            onClick={() => router.push('/driver')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-white">
          Order Fuel Delivery
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fuel Selection */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
              Select Fuel Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gasTypes.map((gas) => (
                <button
                  key={gas.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gasType: gas.value }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.gasType === gas.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="font-semibold text-zinc-900 dark:text-white">{gas.label}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">${gas.price}/gal</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
              Quantity (Gallons)
            </h2>
            <input
              type="number"
              min="5"
              max="50"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Minimum 5 gallons, Maximum 50 gallons
            </p>
          </div>

          {/* Map Location */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
              Delivery Location
            </h2>
            <MapPicker onLocationSelect={handleLocationSelect} />
            {formData.deliveryAddress && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Selected location:</p>
                <p className="font-mono text-sm text-zinc-900 dark:text-white">{formData.deliveryAddress}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
              Additional Notes (Optional)
            </h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Vehicle description, parking instructions..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
              Price Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                <span>Fuel ({formData.quantity} gal × ${selectedGasType?.price})</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                <span>Service Fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-zinc-900 dark:text-white">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
