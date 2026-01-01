# 📍 GPS Tracking System Documentation

## Overview

GasRush now includes a comprehensive real-time GPS tracking system that allows customers to track their fuel delivery in real-time and enables drivers to share their location automatically.

---

## 🌟 Features Implemented

### ✅ Real-Time Location Tracking (Option B)
- Drivers share their GPS location automatically every 5 seconds
- Customers see driver's live location on an interactive map
- Live updates with polling (refreshes every 5 seconds)
- Accurate GPS positioning with high accuracy enabled

### ✅ Full Route History & Analytics (Option C)
- Complete breadcrumb trail of driver's journey
- Route displayed as dashed blue line on map
- Total distance traveled calculation
- Timestamp tracking for every location point
- Route history stored for up to 500 points per order

### ✅ Advanced Tracking with Geofencing (Option D)
- Automatic detection when driver arrives at delivery location
- Geofence radius: 100 meters for nearby detection, 50 meters for arrival
- Smart notifications to driver when near/at destination
- Distance-to-destination calculations in real-time
- ETA calculations based on current location and average speed (40 km/h assumed)

---

## 🎯 How It Works

### For Drivers

1. **Automatic Location Sharing**
   - When driver starts delivery (status: IN_PROGRESS)
   - Location sharing activates automatically
   - Browser requests GPS permission (allow for tracking)
   - Updates every 5 seconds with high accuracy

2. **Geofence Notifications**
   - Driver receives toast notification when within 100 meters
   - "You're near the delivery location" alert
   - Arrival notification at 50 meters
   - "Ready to mark as delivered" prompt

3. **Driver UI**
   - Blue indicator shows "Location Sharing Active"
   - Green pulsing dot when actively tracking
   - Last update timestamp displayed
   - Privacy note: location shared only during active delivery

### For Customers

1. **Live Tracking Map**
   - Automatically appears once driver is assigned
   - Shows driver's current location (blue circle marker)
   - Delivery destination (red marker)
   - Route history (dashed blue line)

2. **Real-Time Stats Dashboard**
   - **Distance Away**: How far driver is from delivery location (km)
   - **ETA**: Estimated time of arrival (minutes)
   - **Distance Traveled**: Total route distance traveled (km)
   - **Last Update**: Timestamp of latest location update

3. **Map Features**
   - Auto-zoom to show both driver and destination
   - Map legend for easy understanding
   - Updates every 5 seconds automatically
   - No manual refresh needed

### For Admins

- Can view all tracking data for any order
- Access to complete route history
- Analytics on total distances traveled
- Monitor driver performance

---

## 🔧 Technical Implementation

### API Endpoints

#### `POST /api/tracking/location`
**Purpose**: Update driver's current location

**Headers**:
- `Authorization: Bearer <token>`

**Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 15.5,
  "orderId": "order123"
}
```

**Response**:
```json
{
  "location": { ... },
  "distance": "1.23",
  "isNearDelivery": false
}
```

#### `GET /api/tracking/location?orderId=<id>`
**Purpose**: Get location history for an order

**Response**:
```json
{
  "locations": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2025-10-31T16:30:00Z",
      "accuracy": 15.5
    },
    ...
  ]
}
```

#### `GET /api/tracking/orders/[orderId]`
**Purpose**: Get complete tracking data for an order

**Response**:
```json
{
  "order": {
    "id": "...",
    "orderNumber": "GR123456",
    "status": "IN_PROGRESS",
    "deliveryLat": 40.7128,
    "deliveryLng": -74.0060,
    "deliveryAddress": "..."
  },
  "driver": {
    "name": "John Doe",
    "phone": "+1 555-0123",
    "vehicleType": "Fuel Truck",
    "licensePlate": "ABC123"
  },
  "tracking": {
    "currentLocation": {
      "latitude": 40.7100,
      "longitude": -74.0050,
      "timestamp": "2025-10-31T16:35:00Z"
    },
    "routeHistory": [ ... ],
    "distanceToDestination": 0.45,
    "totalDistanceTraveled": 5.23,
    "estimatedArrival": {
      "minutes": 12,
      "timestamp": "2025-10-31T16:47:00Z"
    },
    "lastUpdate": "2025-10-31T16:35:00Z"
  }
}
```

#### `PATCH /api/tracking/geofence/[orderId]`
**Purpose**: Check if driver has arrived at delivery location

**Response**:
```json
{
  "message": "Driver has arrived at delivery location",
  "distanceToDestination": 0.03,
  "hasArrived": true,
  "suggestion": "Ready to mark as delivered"
}
```

---

## 📦 Components

### `DriverLocationTracker`
**File**: `/src/components/DriverLocationTracker.tsx`

**Props**:
- `orderId`: string - The order ID to track
- `isActive`: boolean - Whether tracking should be active

**Features**:
- Automatic GPS tracking using browser geolocation API
- High accuracy mode enabled
- Updates every 5 seconds
- Geofence checking and notifications
- Visual indicator of tracking status

### `LiveTrackingMap`
**File**: `/src/components/LiveTrackingMap.tsx`

**Props**:
- `orderId`: string - The order ID to display tracking for

**Features**:
- Real-time map updates every 5 seconds
- Driver location marker (blue circle)
- Destination marker (red pin)
- Route history polyline (dashed blue)
- Stat cards with key metrics
- Auto-zoom to fit bounds
- Map legend

---

## 🧮 Calculations

### Distance Calculation
Uses Haversine formula for accurate distance between GPS coordinates:

```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
```

### ETA Calculation
Assumes average city driving speed of 40 km/h:

```typescript
const averageSpeedKmh = 40;
const estimatedTimeHours = distance / averageSpeedKmh;
const estimatedTimeMinutes = Math.ceil(estimatedTimeHours * 60);
```

### Geofencing Thresholds
- **Near Delivery**: 100 meters (0.1 km)
- **Arrived**: 50 meters (0.05 km)

---

## 🎨 User Experience

### Driver Experience
1. **Accept Order** → Status: ASSIGNED
2. **Start Delivery** → Status: IN_PROGRESS
   - Location tracking activates automatically
   - Blue indicator appears: "Location Sharing Active"
   - Browser asks for GPS permission (one-time)
3. **Drive to Location**
   - Location updates every 5 seconds
   - Toast notification at 100m: "You're near..."
   - Toast notification at 50m: "You have arrived..."
4. **Mark as Delivered** → Status: DELIVERED
   - Location tracking stops automatically

### Customer Experience
1. **Place Order** → Waiting for driver
2. **Driver Assigned** → Live tracking map appears
3. **Track in Real-Time**
   - See driver's location on map
   - View distance away, ETA, and route
   - Map updates automatically every 5 seconds
4. **Driver Arrives** → Ready for delivery
5. **Delivery Complete** → Rate driver

---

## 🔐 Privacy & Security

- Location data only shared during active delivery (IN_PROGRESS status)
- Drivers must grant browser GPS permission
- Location data tied to specific orders
- Historical location data stored for analytics
- Customers can only view their own order tracking
- Admins can view all tracking data

---

## 📊 Database Schema

### Location Model
```prisma
model Location {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(...)
  orderId     String?
  order       Order?   @relation(...)
  latitude    Float
  longitude   Float
  accuracy    Float?
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([orderId])
  @@index([timestamp])
}
```

---

## 🚀 Testing the Tracking System

### Quick Test Flow

1. **Login as Customer** (`customer@test.com`)
   - Place a new order
   - Note the order number

2. **Login as Driver** (`driver@test.com`)
   - Accept the order from dashboard
   - Click "Start Delivery"
   - **Grant GPS permission** when browser asks

3. **Location Sharing Activates**
   - Blue indicator shows "Location Sharing Active"
   - Your location is being sent every 5 seconds

4. **Open Second Browser/Tab**
   - Login as the same customer
   - Go to the order detail page
   - See the live tracking map with your location

5. **Watch Real-Time Updates**
   - Move your device/browser location
   - Watch the map update (5-second refresh)
   - See distance and ETA change

6. **Test Geofencing** (optional)
   - Change your location to be near the delivery location
   - You'll see toast notifications as you approach

---

## 💡 Tips for Best Experience

1. **Use Mobile Device**: GPS tracking works best on phones/tablets with built-in GPS
2. **Enable Location Services**: Make sure device location services are on
3. **Grant Browser Permission**: Allow location access when prompted
4. **Stay on HTTPS**: Geolocation API requires secure connection
5. **Keep Tab Open**: Location sharing only works when page is active

---

## 🐛 Troubleshooting

**Issue**: Location tracking not working
**Solutions**:
- Check if GPS permission was granted
- Ensure HTTPS connection (required for geolocation API)
- Check browser console for errors
- Verify order status is IN_PROGRESS

**Issue**: Map not showing driver location
**Solutions**:
- Wait 5-10 seconds for first update
- Check if driver has started delivery
- Refresh the page
- Verify driver granted GPS permission

**Issue**: Inaccurate location
**Solutions**:
- Ensure device has clear view of sky (for GPS)
- Check if using WiFi location instead of GPS
- Verify `enableHighAccuracy` is set to true

**Issue**: No geofence notifications
**Solutions**:
- Check if within 100 meters of delivery location
- Verify order status is IN_PROGRESS
- Ensure location updates are working

---

## 🎯 Performance Considerations

- **Update Frequency**: 5 seconds (balance between real-time and battery/data usage)
- **Location Points Stored**: Up to 500 per order (prevents database bloat)
- **Map Refresh**: 5 seconds (smooth updates without overwhelming server)
- **Geofence Check**: Only when near destination (optimized)
- **High Accuracy Mode**: Enabled for precise tracking (may drain battery faster)

---

## 🔮 Future Enhancements

Potential improvements for future versions:

1. **WebSocket Integration**: Replace polling with WebSocket for true real-time updates
2. **Traffic Data**: Integrate with traffic APIs for more accurate ETA
3. **Route Optimization**: Suggest optimal routes to drivers
4. **Multi-Stop Support**: Handle multiple deliveries in one trip
5. **Offline Support**: Cache location data when offline, sync when back online
6. **Push Notifications**: Alert customers when driver is near
7. **Speed Monitoring**: Track and display driver's speed
8. **Battery Optimization**: Adjust update frequency based on battery level

---

## 📝 Code Examples

### Enable Tracking for a Driver
```typescript
<DriverLocationTracker
  orderId={order.id}
  isActive={order.status === 'IN_PROGRESS'}
/>
```

### Display Live Tracking for Customer
```typescript
<LiveTrackingMap orderId={order.id} />
```

### Manual Location Update (for testing)
```typescript
const response = await fetch('/api/tracking/location', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 15,
    orderId: 'order123',
  }),
});
```

---

## 📄 Summary

The GPS tracking system provides:
- ✅ **Real-time location updates** (every 5 seconds)
- ✅ **Complete route history** with breadcrumb trails
- ✅ **Automatic geofencing** with arrival detection
- ✅ **ETA calculations** based on distance
- ✅ **Distance analytics** for routes traveled
- ✅ **Live map visualization** for customers
- ✅ **Smart notifications** for drivers
- ✅ **Privacy-focused** (only during active deliveries)

All three requested features (B, C, D) have been fully implemented and are ready to use! 🎉
