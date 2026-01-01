import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, ApiError } from '@/lib/api-middleware';
import { calculateDistance, calculateETA, calculateRouteDistance } from '@/lib/geospatial';
import { orderInclude } from '@/lib/db-selects';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return withAuth(request, async (req, context) => {
    try {
      const orderId = params.orderId;

      // Get order with driver and customer info using standard include
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });

      if (!order) {
        return ApiError.notFound('Order not found');
      }

      // Check if user has access to this order
      const isCustomer = req.user.userId === order.customerId;
      const isDriver = order.driver && req.user.userId === order.driver.userId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isCustomer && !isDriver && !isAdmin) {
        return ApiError.forbidden('You do not have access to this order');
      }

      // Get driver's latest location and route history
      let driverLocation = null;
      let routeHistory = [];
      let estimatedArrival = null;
      let distanceToDestination = null;

      if (order.driver) {
        // Get most recent location
        const latestLocation = await prisma.location.findFirst({
          where: {
            userId: order.driver.userId,
            orderId: order.id,
          },
          orderBy: { timestamp: 'desc' },
        });

        driverLocation = latestLocation;

        // Get route history (breadcrumb trail)
        routeHistory = await prisma.location.findMany({
          where: {
            userId: order.driver.userId,
            orderId: order.id,
          },
          orderBy: { timestamp: 'asc' },
          take: 500,
        });

        // Calculate distance and ETA if driver location is available
        if (latestLocation) {
          const distance = calculateDistance(
            latestLocation.latitude,
            latestLocation.longitude,
            order.deliveryLat,
            order.deliveryLng
          );

          distanceToDestination = distance;
          estimatedArrival = calculateETA(distance);
        }
      }

      // Calculate total distance traveled using geospatial utility
      const totalDistance = calculateRouteDistance(routeHistory);

      return NextResponse.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          deliveryAddress: order.deliveryAddress,
          deliveryLat: order.deliveryLat,
          deliveryLng: order.deliveryLng,
        },
        driver: order.driver
          ? {
              name: order.driver.user.name,
              phone: order.driver.user.phone,
              vehicleType: order.driver.vehicleType,
              licensePlate: order.driver.licensePlate,
            }
          : null,
        tracking: {
          currentLocation: driverLocation,
          routeHistory,
          distanceToDestination: distanceToDestination
            ? parseFloat(distanceToDestination.toFixed(2))
            : null,
          totalDistanceTraveled: parseFloat(totalDistance.toFixed(2)),
          estimatedArrival,
          lastUpdate: driverLocation?.timestamp || null,
        },
      });
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      return ApiError.serverError('Failed to fetch tracking data');
    }
  }, { params });
}
