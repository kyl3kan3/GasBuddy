# GasRush Codebase Refactoring Analysis Report

## Executive Summary
Analyzed the GasRush fuel delivery application codebase. Identified **17 major refactoring opportunities** across API routes, components, and utilities. The most critical issues are code duplication in API patterns and utility functions.

---

## HIGH PRIORITY REFACTORING OPPORTUNITIES

### 1. **Duplicate Distance Calculation Functions** [CRITICAL]
**Files affected:**
- `/src/app/api/tracking/location/route.ts` (lines 128-153)
- `/src/app/api/tracking/geofence/[orderId]/route.ts` (lines 102-127)
- `/src/app/api/tracking/orders/[orderId]/route.ts` (lines 161-186)

**Issue:** The Haversine distance calculation and `toRad()` helper are duplicated 3 times across different files.

**Recommendation:** Extract to `/src/lib/geospatial.ts`:
```typescript
export function calculateDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number { ... }

export function toRad(degrees: number): number { ... }

export const GEOFENCE_THRESHOLDS = {
  ARRIVAL_THRESHOLD_KM: 0.05,
  NEAR_DELIVERY_KM: 0.1,
} as const;
```

**Impact:** Eliminates 60+ lines of duplicate code, improves maintainability, centralizes distance constants.

---

### 2. **Repetitive API Authentication Pattern** [HIGH]
**Files affected:** All API routes (15+ files)

**Pattern:** Every route repeats the same token extraction and verification:
```typescript
// Repeated pattern across all routes
const token = request.headers.get('authorization')?.replace('Bearer ', '');
if (!token) {
  return NextResponse.json({ error: 'Unauthorized', message: 'No token provided' }, { status: 401 });
}

const payload = verifyToken(token);
if (!payload) {
  return NextResponse.json({ error: 'Unauthorized', message: 'Invalid token' }, { status: 401 });
}
```

**Recommendation:** Create `/src/lib/api-middleware.ts`:
```typescript
export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> { ... }

export async function requireAuth(request: NextRequest): Promise<{ payload: JWTPayload } | { error: NextResponse }> { ... }

export async function requireRole(request: NextRequest, roles: string[]): Promise<{ payload: JWTPayload; user: User } | { error: NextResponse }> { ... }
```

**Impact:** Reduces ~50 lines of duplicated authentication code, improves security consistency.

---

### 3. **Inconsistent Error Response Patterns** [MEDIUM-HIGH]
**Files affected:** All API routes

**Issue:** Error responses use different formats:
- Some: `{ error: 'key', message: 'text' }`
- Some: `{ error: 'text' }`
- Different status codes for same scenarios

**Recommendation:** Create `/src/lib/api-responses.ts`:
```typescript
export const ApiErrors = {
  UNAUTHORIZED: () => NextResponse.json(
    { error: 'Unauthorized', message: 'No token provided' },
    { status: 401 }
  ),
  FORBIDDEN: (msg?: string) => NextResponse.json(
    { error: 'Forbidden', message: msg || 'Access denied' },
    { status: 403 }
  ),
  NOT_FOUND: (resource: string) => NextResponse.json(
    { error: 'Not found', message: `${resource} not found` },
    { status: 404 }
  ),
  // ... etc
};

export const ApiSuccess = {
  created: (data: any) => NextResponse.json(data, { status: 201 }),
  ok: (data: any) => NextResponse.json(data, { status: 200 }),
};
```

**Impact:** Standardizes error handling, improves API consistency, easier debugging.

---

### 4. **Duplicate Database Selects** [MEDIUM]
**Files affected:** Multiple order routes

**Issue:** Customer selection pattern repeated everywhere:
```typescript
customer: {
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
  },
}
```

And driver selection repeated in 6+ files.

**Recommendation:** Create `/src/lib/db-selects.ts`:
```typescript
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const;

export const CUSTOMER_SELECT = {
  select: USER_SELECT,
} as const;

export const ORDER_WITH_DETAILS = {
  include: {
    customer: CUSTOMER_SELECT,
    driver: {
      include: { user: { select: USER_SELECT } },
    },
  },
} as const;
```

**Impact:** Reduces ~40 lines of duplicate code, improves consistency, easier schema changes.

---

### 5. **Duplicate Prisma Instance Creation** [MEDIUM]
**Files affected:**
- `/src/app/api/tracking/location/route.ts` (line 5)
- `/src/app/api/tracking/geofence/[orderId]/route.ts` (line 5)
- `/src/app/api/tracking/orders/[orderId]/route.ts` (line 5)

**Issue:** Multiple files create `new PrismaClient()` instead of using singleton from `/src/lib/prisma.ts`.

**Recommendation:** Update all imports to:
```typescript
import { prisma } from '@/lib/prisma';
```

**Impact:** Proper connection pooling, prevents resource leaks, follows Next.js best practices.

---

### 6. **Duplicate Order Status Validation** [MEDIUM]
**Files affected:**
- `/src/app/api/orders/[id]/status/route.ts` (line 45)
- Multiple components

**Issue:** Valid status array `['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED']` is hardcoded.

**Recommendation:** Create `/src/lib/constants.ts`:
```typescript
export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const VALID_ORDER_STATUSES = Object.values(ORDER_STATUSES);
```

**Impact:** Single source of truth for status values, prevents typos, easier to extend.

---

## MEDIUM PRIORITY REFACTORING OPPORTUNITIES

### 7. **Extract Status Color Logic** [MEDIUM]
**Files affected:**
- `/src/app/orders/page.tsx` (lines 133-148)

**Issue:** `getStatusColor()` function is specific to one page but used in components.

**Recommendation:** Create `/src/lib/status-colors.ts`:
```typescript
export const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  ASSIGNED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  IN_PROGRESS: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  DELIVERED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
} as const;

export function getStatusColor(status: string): string { ... }
```

**Impact:** Reusable across components, centralized styling.

---

### 8. **Extract Leaflet Map Configuration** [MEDIUM]
**Files affected:**
- `/src/components/MapPicker.tsx` (lines 28-41)
- `/src/components/LiveTrackingMap.tsx` (lines 115-130)

**Issue:** Leaflet icon configuration duplicated.

**Recommendation:** Create `/src/lib/map-config.ts`:
```typescript
export const LEAFLET_CONFIG = {
  DEFAULT_ZOOM: 13,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; OpenStreetMap contributors',
  ICONS: {
    DEFAULT: L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      // ...
    }),
  },
} as const;
```

**Impact:** Centralized map configuration, easier to switch tile providers, consistent maps.

---

### 9. **Create API Client Service** [MEDIUM]
**Files affected:** All pages making API calls

**Issue:** Fetch boilerplate repeated across components (token extraction, error handling).

**Recommendation:** Create `/src/lib/api-client.ts`:
```typescript
export class ApiClient {
  constructor(private token: string | null) {}

  async get<T>(url: string): Promise<T> { ... }
  async post<T>(url: string, data: any): Promise<T> { ... }
  async patch<T>(url: string, data: any): Promise<T> { ... }
}

export function useApi() {
  const { token } = useAuth();
  return new ApiClient(token);
}
```

**Impact:** Eliminates fetch boilerplate, better error handling, type-safe API calls.

---

### 10. **Large Page Components Should Be Split** [MEDIUM]
**Files affected:**
- `/src/app/orders/page.tsx` (362 lines)
- `/src/app/driver/page.tsx` (216 lines)

**Issue:** Orders page is too large, contains filtering logic, CSV export, and UI in one file.

**Recommendation:** Split `/src/app/orders/page.tsx`:
- `/src/components/OrdersFilters.tsx` - Search/filter controls
- `/src/components/OrdersList.tsx` - Order list display
- `/src/lib/orders-helpers.ts` - Filter and sort logic
- `/src/app/orders/page.tsx` - Composition only

**Impact:** Better maintainability, testable logic, reusable components.

---

### 11. **Extract CSV Export Logic** [MEDIUM]
**Files affected:** `/src/app/orders/page.tsx` (lines 92-131)

**Issue:** CSV export logic mixed with component logic.

**Recommendation:** Create `/src/lib/csv-export.ts`:
```typescript
export function generateCSV(orders: Order[]): string { ... }
export function downloadCSV(csvContent: string, filename: string): void { ... }
export function createOrdersCSV(orders: Order[]): void { ... }
```

**Impact:** Reusable export for other data types, easier testing.

---

### 12. **Extract Rating Calculation** [MEDIUM]
**Files affected:** `/src/app/api/ratings/route.ts` (lines 99-104)

**Issue:** Average rating calculation logic in route handler.

**Recommendation:** Create `/src/lib/rating-helpers.ts`:
```typescript
export async function calculateDriverAvgRating(driverId: string): Promise<number> { ... }
export async function updateDriverRating(driverId: string): Promise<void> { ... }
```

**Impact:** Reusable logic, easier to add weighted ratings, testable.

---

## MEDIUM PRIORITY (COMPONENT LEVEL)

### 13. **Extract Map Marker Creation** [MEDIUM]
**Files affected:**
- `/src/components/LiveTrackingMap.tsx` (lines 121-137, 153-167)

**Issue:** Leaflet marker creation code is verbose and repeated.

**Recommendation:** Create helper function or component wrapper.

---

### 14. **Missing Validation Utilities** [MEDIUM]
**Issue:** Input validation scattered across routes:
- Email validation
- Phone validation
- Numeric parsing

**Recommendation:** Create `/src/lib/validators.ts` using Zod schemas:
```typescript
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const CreateOrderSchema = z.object({
  gasType: z.enum(['REGULAR', 'PLUS', 'PREMIUM', 'DIESEL']),
  quantity: z.number().positive(),
  // ...
});
```

**Impact:** Centralized validation, type safety, reusable schemas.

---

### 15. **Extract Toast/Notification Context** [LOW-MEDIUM]
**Files affected:** `/src/contexts/ToastContext.tsx`

**Issue:** Toast context exists but could be extended with more features.

**Recommendation:** Add notification queue, auto-dismiss, priority levels.

---

## LOW PRIORITY REFACTORING OPPORTUNITIES

### 16. **Extract Hardcoded Constants** [LOW]
**Hardcoded values found:**
- NYC coordinates: `40.7128, -74.0060` in MapPicker
- Average speed: `40 km/h` in tracking route
- Stripe API version: `'2024-11-20.acacia'` in payments
- Bcrypt salt rounds: `10` in register route

**Recommendation:** Move all to `/src/lib/constants.ts`

---

### 17. **Improve Type Safety** [LOW]
**Files affected:** Multiple files

**Issue:** Some files use `any` type:
- `/src/app/api/orders/[id]/status/route.ts` (line 113: `updateData: any`)
- `/src/app/api/ratings/route.ts` (line 117: `catch (error: any)`)

**Recommendation:** Define proper types instead of using `any`.

---

## REFACTORING PRIORITY MATRIX

| Priority | Effort | Impact | Issues |
|----------|--------|--------|--------|
| CRITICAL | Low | High | #1 (3 duplicated functions) |
| HIGH | Medium | High | #2 (Auth pattern) |
| HIGH | Low | Medium | #5 (Prisma instance) |
| HIGH | Low | High | #4 (DB selects) |
| MEDIUM | Medium | Medium | #3 (Error responses) |
| MEDIUM | Medium | Medium | #6 (Status validation) |
| MEDIUM | Medium | Medium | #10 (Large components) |
| MEDIUM | Low | Low | #7 (Status colors) |
| MEDIUM | Low | Low | #8 (Map config) |
| MEDIUM | Medium | Low | #9 (API client) |
| MEDIUM | Low | Low | #11 (CSV export) |
| LOW | Low | Low | #12 (Rating calc) |
| LOW | Low | Low | #16 (Constants) |
| LOW | Low | Low | #17 (Types) |

---

## RECOMMENDED REFACTORING TIMELINE

### Phase 1: Critical (Week 1)
1. Extract duplicate distance functions to `/src/lib/geospatial.ts`
2. Fix Prisma instance duplication

### Phase 2: High Impact (Week 1-2)
3. Create API middleware for authentication
4. Create database select helpers
5. Extract error response patterns

### Phase 3: Medium (Week 2-3)
6. Create constants file for hardcoded values
7. Split large components (orders page)
8. Add validation schemas

### Phase 4: Polish (Week 3)
9. Extract remaining utilities
10. Improve type safety

---

## CODE ORGANIZATION SUGGESTION

After refactoring, suggested structure:

```
/src
  /lib
    api-client.ts          # API fetching utility
    api-middleware.ts      # Auth middleware
    api-responses.ts       # Error/success responses
    constants.ts           # Hardcoded values
    csv-export.ts          # CSV generation
    db-selects.ts          # Prisma selects
    geospatial.ts          # Distance calculations
    map-config.ts          # Leaflet configuration
    rating-helpers.ts      # Rating calculations
    status-colors.ts       # UI status colors
    validators.ts          # Zod schemas
  /components
    OrdersFilters.tsx      # Split from orders page
    OrdersList.tsx         # Split from orders page
    [existing components]
  /app
    /api
      [routes - simplified]
    [pages]
```

---

## Testing Recommendations

After refactoring, ensure:
1. All API routes have consistent error responses
2. Distance calculations are tested with known coordinates
3. CSV export maintains data integrity
4. Type safety is verified with strict TypeScript
5. Performance is not impacted (especially geospatial queries)

---

## Conclusion

**Total estimated savings:**
- ~200+ lines of duplicate code eliminated
- ~15+ files will be simplified
- ~1000+ lines of code will be more maintainable

**Estimated effort:** 20-30 developer hours
**Risk level:** Low (these are internal refactorings with no breaking changes to APIs)

