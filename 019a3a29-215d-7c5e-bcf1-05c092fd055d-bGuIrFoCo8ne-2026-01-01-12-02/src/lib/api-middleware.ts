/**
 * API Middleware
 *
 * Reusable middleware functions for API routes including
 * authentication, authorization, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

export type AuthenticatedRequest = NextRequest & {
  user: {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
  };
};

/**
 * Extract and verify JWT token from request
 *
 * @param request - Next.js request object
 * @returns Decoded token payload or null
 */
export function extractToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}

/**
 * Middleware to require authentication
 *
 * Usage:
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (req) => {
 *     const user = req.user; // User is available
 *     return NextResponse.json({ user });
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  context?: any
): Promise<NextResponse> {
  const decoded = extractToken(request);

  if (!decoded) {
    return NextResponse.json(
      { error: 'Unauthorized - No valid token provided' },
      { status: 401 }
    );
  }

  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role as 'CUSTOMER' | 'DRIVER' | 'ADMIN',
  };

  return handler(authenticatedRequest, context);
}

/**
 * Middleware to require specific role
 *
 * Usage:
 * export async function GET(request: NextRequest) {
 *   return withRole(request, 'ADMIN', async (req) => {
 *     // Only admins can access this
 *     return NextResponse.json({ data: 'admin only' });
 *   });
 * }
 */
export async function withRole(
  request: NextRequest,
  allowedRoles: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | Array<'CUSTOMER' | 'DRIVER' | 'ADMIN'>,
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  context?: any
): Promise<NextResponse> {
  return withAuth(request, async (req) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, context);
  }, context);
}

/**
 * Middleware for customer-only routes
 */
export async function withCustomer(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  context?: any
): Promise<NextResponse> {
  return withRole(request, 'CUSTOMER', handler, context);
}

/**
 * Middleware for driver-only routes
 */
export async function withDriver(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  context?: any
): Promise<NextResponse> {
  return withRole(request, 'DRIVER', handler, context);
}

/**
 * Middleware for admin-only routes
 */
export async function withAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  context?: any
): Promise<NextResponse> {
  return withRole(request, 'ADMIN', handler, context);
}

/**
 * Standard API error responses
 */
export const ApiError = {
  unauthorized: (message = 'Unauthorized') =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message = 'Forbidden') =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (message = 'Not found') =>
    NextResponse.json({ error: message }, { status: 404 }),

  badRequest: (message = 'Bad request') =>
    NextResponse.json({ error: message }, { status: 400 }),

  serverError: (message = 'Internal server error') =>
    NextResponse.json({ error: message }, { status: 500 }),

  conflict: (message = 'Conflict') =>
    NextResponse.json({ error: message }, { status: 409 }),
};

/**
 * Standard API success responses
 */
export const ApiSuccess = {
  ok: (data: any) => NextResponse.json(data, { status: 200 }),

  created: (data: any) => NextResponse.json(data, { status: 201 }),

  noContent: () => new NextResponse(null, { status: 204 }),
};

/**
 * Validate request body against required fields
 *
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Error response if validation fails, null if valid
 */
export function validateRequestBody(
  body: any,
  requiredFields: string[]
): NextResponse | null {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    return ApiError.badRequest(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  return null;
}

/**
 * Safe JSON parsing with error handling
 *
 * @param request - Next.js request object
 * @returns Parsed JSON or error response
 */
export async function safeParseJSON(
  request: NextRequest
): Promise<{ data?: any; error?: NextResponse }> {
  try {
    const data = await request.json();
    return { data };
  } catch (error) {
    return {
      error: ApiError.badRequest('Invalid JSON in request body'),
    };
  }
}
