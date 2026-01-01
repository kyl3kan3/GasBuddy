'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-zinc-50 dark:from-zinc-950 dark:to-blue-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-6">
            Fuel Delivery at Your
            <span className="block text-blue-600 dark:text-blue-400">
              Doorstep
            </span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto mb-8">
            Never worry about running out of gas again. Order fuel delivery to your location in minutes.
          </p>

          {user ? (
            <div className="flex justify-center gap-4">
              <Link
                href={user.role === 'driver' ? '/driver' : '/order'}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {user.role === 'driver' ? 'View Orders' : 'Order Now'}
              </Link>
              <Link
                href="/orders"
                className="px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                My Orders
              </Link>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Fast Delivery
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Get fuel delivered to your location in under 30 minutes
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Track in Real-Time
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Follow your delivery driver on the map as they approach
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Secure Payment
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Pay safely with credit card or other secure payment methods
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                1
              </div>
              <h4 className="font-semibold mb-2 text-zinc-900 dark:text-white">Choose Fuel Type</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Select your preferred fuel type and quantity
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                2
              </div>
              <h4 className="font-semibold mb-2 text-zinc-900 dark:text-white">Set Location</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Mark your exact location on the map
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                3
              </div>
              <h4 className="font-semibold mb-2 text-zinc-900 dark:text-white">Track Delivery</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Watch as your driver heads to you in real-time
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                4
              </div>
              <h4 className="font-semibold mb-2 text-zinc-900 dark:text-white">Refuel</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Get your tank filled without leaving your vehicle
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
