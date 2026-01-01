'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import L from 'leaflet';

interface TrackingData {
  order: {
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress: string;
    status: string;
  };
  driver: {
    name: string;
    phone: string;
    vehicleType: string;
    licensePlate: string;
  } | null;
  tracking: {
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: string;
    } | null;
    routeHistory: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
    }>;
    distanceToDestination: number | null;
    totalDistanceTraveled: number;
    estimatedArrival: {
      minutes: number;
      timestamp: string;
    } | null;
    lastUpdate: string | null;
  };
}

interface LiveTrackingMapProps {
  orderId: string;
}

export default function LiveTrackingMap({ orderId }: LiveTrackingMapProps) {
  const { token } = useAuth();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetchTrackingData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchTrackingData, 5000);

    return () => clearInterval(interval);
  }, [orderId, token]);

  useEffect(() => {
    if (!isClient || !trackingData) return;

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, trackingData]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/tracking/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        updateMap(data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!trackingData || mapRef.current) return;

    const { deliveryLat, deliveryLng } = trackingData.order;
    const currentLoc = trackingData.tracking.currentLocation;

    // Center map on current location or destination
    const centerLat = currentLoc ? currentLoc.latitude : deliveryLat;
    const centerLng = currentLoc ? currentLoc.longitude : deliveryLng;

    const map = L.map('live-tracking-map').setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Add destination marker
    const destinationIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const destinationMarker = L.marker([deliveryLat, deliveryLng], {
      icon: destinationIcon,
    }).addTo(map);

    destinationMarker.bindPopup('Delivery Location').openPopup();
    destinationMarkerRef.current = destinationMarker;

    updateMap(trackingData);
  };

  const updateMap = (data: TrackingData) => {
    if (!mapRef.current || !isClient) return;

    const map = mapRef.current;
    const { currentLocation, routeHistory } = data.tracking;

    // Update or create driver marker
    if (currentLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([currentLocation.latitude, currentLocation.longitude]);
      } else {
        // Create custom driver icon (blue circle)
        const driverIcon = L.divIcon({
          className: 'driver-marker',
          html: '<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const driverMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {
          icon: driverIcon,
        }).addTo(map);

        driverMarker.bindPopup('Driver Location');
        driverMarkerRef.current = driverMarker;
      }
    }

    // Update route history polyline
    if (routeHistory.length > 1) {
      const routeCoords = routeHistory.map((loc) => [loc.latitude, loc.longitude] as [number, number]);

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(routeCoords);
      } else {
        const routeLine = L.polyline(routeCoords, {
          color: '#3B82F6',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10',
        }).addTo(map);

        routeLineRef.current = routeLine;
      }

      // Fit bounds to show both driver and destination
      if (currentLocation && destinationMarkerRef.current) {
        const bounds = L.latLngBounds([
          [currentLocation.latitude, currentLocation.longitude],
          [data.order.deliveryLat, data.order.deliveryLng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="animate-pulse">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">Unable to load tracking data</p>
      </div>
    );
  }

  const { tracking, driver } = trackingData;

  return (
    <div className="space-y-4">
      {/* Tracking Stats */}
      {driver && tracking.currentLocation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Distance Away</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {tracking.distanceToDestination ? `${tracking.distanceToDestination} km` : '—'}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">ETA</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {tracking.estimatedArrival ? `${tracking.estimatedArrival.minutes} min` : '—'}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Distance Traveled</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {tracking.totalDistanceTraveled.toFixed(1)} km
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Last Update</div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {tracking.lastUpdate
                ? new Date(tracking.lastUpdate).toLocaleTimeString()
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div id="live-tracking-map" style={{ height: '500px', width: '100%' }} />
      </div>

      {/* Legend */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Map Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            <span className="text-zinc-700 dark:text-zinc-300">Driver Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-sm"></div>
            <span className="text-zinc-700 dark:text-zinc-300">Delivery Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-blue-500" style={{ width: '20px', borderStyle: 'dashed' }}></div>
            <span className="text-zinc-700 dark:text-zinc-300">Route Traveled</span>
          </div>
        </div>
      </div>

      {!driver && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            No driver assigned yet. Tracking will be available once a driver accepts your order.
          </p>
        </div>
      )}
    </div>
  );
}
