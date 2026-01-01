'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat = 40.7128, initialLng = -74.0060 }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Initialize map
    if (!mapRef.current) {
      const map = L.map('map').setView([initialLat, initialLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add marker on initial position
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', function() {
        const position = marker.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      // Handle map click to move marker
      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
            marker.setLatLng([latitude, longitude]);
            onLocationSelect(latitude, longitude);
          },
          (error) => {
            console.log('Could not get location:', error);
          }
        );
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isClient, initialLat, initialLng, onLocationSelect]);

  if (!isClient) {
    return <div className="w-full h-96 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />;
  }

  return (
    <div>
      <div id="map" className="w-full h-96 rounded-lg border border-zinc-200 dark:border-zinc-700" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        Click or drag the marker to set your delivery location
      </p>
    </div>
  );
}
