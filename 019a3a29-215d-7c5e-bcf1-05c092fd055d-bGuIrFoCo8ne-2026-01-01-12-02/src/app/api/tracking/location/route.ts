import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, ApiError, validateRequestBody, safeParseJSON } from '@/lib/api-middleware';
import { calculateDistance, getProximityStatus, GEOFENCE } from '@/lib/geospatial';

const prisma = new PrismaClient();

// POST - Update driver's current location
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    const { data: body, error } = await safeParseJSON(request);
    if (error) return error;

    const validation = validateRequestBody(body, ['latitude', 'longitude']);
    if (validation) return validation;

    const { latitude, longitude, accuracy, orderId } = body;

    try {
      // Create location entry
      const location = await prisma.location.create({
        data: {
          userId: req.user.userId,
          orderId: orderId || null,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : null,
          timestamp: new Date(),
        },
      });

      // If this is for an active order, check geofencing
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            deliveryLat: true,
            deliveryLng: true,
            status: true,
          },
        });

        if (order && order.status === 'IN_PROGRESS') {
          const distance = calculateDistance(
            latitude,
            longitude,
            order.deliveryLat,
            order.deliveryLng
          );

          const proximityStatus = getProximityStatus(distance);
          const isNearDelivery = proximityStatus === 'nearby' || proximityStatus === 'arrived';

          return NextResponse.json({
            location,
            distance: distance.toFixed(2),
            isNearDelivery,
            proximityStatus,
          });
        }
      }

      return NextResponse.json({ location });
    } catch (error) {
      console.error('Error updating location:', error);
      return ApiError.serverError('Failed to update location');
    }
  });
}

// GET - Get location history for a user or order
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(request.url);
      const orderId = searchParams.get('orderId');
      const userId = searchParams.get('userId');
      const limit = parseInt(searchParams.get('limit') || '100');

      let locations;

      if (orderId) {
        // Get location history for specific order
        locations = await prisma.location.findMany({
          where: { orderId },
          orderBy: { timestamp: 'asc' },
          take: limit,
        });
      } else if (userId) {
        // Get location history for specific user
        locations = await prisma.location.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: limit,
        });
      } else {
        // Get user's own location history
        locations = await prisma.location.findMany({
          where: { userId: req.user.userId },
          orderBy: { timestamp: 'desc' },
          take: limit,
        });
      }

      return NextResponse.json({ locations });
    } catch (error) {
      console.error('Error fetching locations:', error);
      return ApiError.serverError('Failed to fetch locations');
    }
  });
}
