import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withDriver, ApiError } from '@/lib/api-middleware';
import { calculateDistance, isWithinGeofence, GEOFENCE } from '@/lib/geospatial';

const prisma = new PrismaClient();

// PATCH - Check geofence and auto-update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return withDriver(request, async (req, context) => {
    try {
      const orderId = params.orderId;

      // Get order with driver info
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          driver: true,
        },
      });

      if (!order) {
        return ApiError.notFound('Order not found');
      }

      // Verify this driver is assigned to this order
      if (!order.driver || order.driver.userId !== req.user.userId) {
        return ApiError.forbidden('You are not assigned to this order');
      }

      // Only check if order is IN_PROGRESS
      if (order.status !== 'IN_PROGRESS') {
        return NextResponse.json({
          message: 'Order is not in progress',
          statusUpdated: false,
        });
      }

      // Get driver's latest location
      const latestLocation = await prisma.location.findFirst({
        where: {
          userId: req.user.userId,
          orderId: order.id,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!latestLocation) {
        return NextResponse.json({
          message: 'No location data available',
          statusUpdated: false,
        });
      }

      // Calculate distance to delivery location
      const distance = calculateDistance(
        latestLocation.latitude,
        latestLocation.longitude,
        order.deliveryLat,
        order.deliveryLng
      );

      const hasArrived = isWithinGeofence(distance, GEOFENCE.ARRIVAL_THRESHOLD);

      if (!hasArrived) {
        return NextResponse.json({
          message: 'Not yet at delivery location',
          distanceToDestination: parseFloat(distance.toFixed(3)),
          statusUpdated: false,
        });
      }

      // Driver has arrived - suggest marking as delivered
      return NextResponse.json({
        message: 'Driver has arrived at delivery location',
        distanceToDestination: parseFloat(distance.toFixed(3)),
        hasArrived: true,
        statusUpdated: false,
        suggestion: 'Ready to mark as delivered',
      });
    } catch (error) {
      console.error('Error checking geofence:', error);
      return ApiError.serverError('Failed to check geofence');
    }
  }, { params });
}
