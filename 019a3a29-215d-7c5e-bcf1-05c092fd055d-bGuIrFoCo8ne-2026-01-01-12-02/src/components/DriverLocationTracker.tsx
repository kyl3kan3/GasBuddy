'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface DriverLocationTrackerProps {
  orderId: string;
  isActive: boolean; // Only track when order is IN_PROGRESS
}

export default function DriverLocationTracker({ orderId, isActive }: DriverLocationTrackerProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !token) {
      stopTracking();
      return;
    }

    startTracking();

    return () => {
      stopTracking();
    };
  }, [isActive, token, orderId]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsTracking(true);

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateLocation(latitude, longitude, accuracy);
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Unable to get your location', 'error');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update every 5 seconds
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const updateLocation = async (latitude: number, longitude: number, accuracy?: number) => {
    try {
      const response = await fetch('/api/tracking/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
          orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdate(new Date());

        // Check if near delivery location
        if (data.isNearDelivery) {
          showToast(`You're near the delivery location (${data.distance}km away)`, 'info');

          // Check geofence for automatic status suggestions
          checkGeofence();
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const checkGeofence = async () => {
    try {
      const response = await fetch(`/api/tracking/geofence/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.hasArrived) {
          showToast('You have arrived at the delivery location! Ready to mark as delivered.', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to check geofence:', error);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              {isTracking ? 'Location Sharing Active' : 'Location Sharing Inactive'}
            </h3>
            {lastUpdate && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="text-2xl">📍</div>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
        Your location is being shared with the customer for this delivery
      </p>
    </div>
  );
}
