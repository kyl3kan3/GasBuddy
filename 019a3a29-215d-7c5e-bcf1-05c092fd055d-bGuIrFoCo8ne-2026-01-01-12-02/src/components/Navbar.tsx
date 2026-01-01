'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">⚡</div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                GasRush
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/order'}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    pathname === (user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/order')
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {user.role === 'driver' ? 'Dashboard' : user.role === 'admin' ? 'Admin' : 'Order Fuel'}
                </Link>
                <Link
                  href="/orders"
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    pathname === '/orders'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {user.role === 'admin' ? 'All Orders' : 'My Orders'}
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {user.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
