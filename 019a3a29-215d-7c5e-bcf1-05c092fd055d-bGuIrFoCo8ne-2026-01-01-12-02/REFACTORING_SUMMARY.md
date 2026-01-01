# GasRush Refactoring - Quick Reference

## Key Statistics
- **17 refactoring opportunities identified**
- **200+ lines of duplicate code** can be eliminated
- **Estimated effort:** 20-30 developer hours
- **Risk level:** Low (internal refactorings only)

## Top 5 Issues to Fix First

### 1. Distance Calculation Duplication [CRITICAL]
- Located in 3 files (tracking routes)
- **Fix:** Create `/src/lib/geospatial.ts`
- **Impact:** Eliminate 60+ lines of code

### 2. Auth Pattern Repetition [HIGH]
- Present in 15+ API routes
- **Fix:** Create `/src/lib/api-middleware.ts`
- **Impact:** Reduce 50+ lines of boilerplate

### 3. Database Select Patterns [HIGH]
- Customer/driver selects repeated 6+ times
- **Fix:** Create `/src/lib/db-selects.ts`
- **Impact:** Reduce 40+ lines of code

### 4. Inconsistent Error Responses [HIGH]
- Different formats across routes
- **Fix:** Create `/src/lib/api-responses.ts`
- **Impact:** Improve API consistency

### 5. Duplicate Prisma Instances [HIGH]
- 3 files create their own instances
- **Fix:** Use singleton from `/src/lib/prisma.ts`
- **Impact:** Proper connection pooling

## Files That Will Most Benefit

### API Routes (Should Lose ~40-50% of code)
- `/src/app/api/auth/*.ts` - Remove auth boilerplate
- `/src/app/api/orders/*.ts` - Remove duplicate selects
- `/src/app/api/tracking/*.ts` - Remove distance duplication

### Components (Should Lose ~20-30% of code)
- `/src/app/orders/page.tsx` - Split into 3 files
- `/src/app/driver/page.tsx` - Simplify logic

## New Files to Create

### Highest Priority
```
/src/lib/
├── geospatial.ts          # Distance calculations
├── api-middleware.ts      # Auth helpers
├── db-selects.ts          # Prisma select helpers
└── api-responses.ts       # Error/success responses
```

### Medium Priority
```
/src/lib/
├── constants.ts           # Hardcoded values
├── validators.ts          # Zod schemas
├── csv-export.ts          # Export utilities
└── status-colors.ts       # UI constants
```

### Nice to Have
```
/src/lib/
├── api-client.ts          # API service class
├── map-config.ts          # Leaflet config
└── rating-helpers.ts      # Rating utilities

/src/components/
├── OrdersFilters.tsx      # Extracted from orders page
└── OrdersList.tsx         # Extracted from orders page
```

## Implementation Checklist

- [ ] Phase 1: Extract geospatial functions
- [ ] Phase 1: Fix Prisma instances
- [ ] Phase 2: Create auth middleware
- [ ] Phase 2: Create db-selects helper
- [ ] Phase 2: Standardize error responses
- [ ] Phase 3: Create constants file
- [ ] Phase 3: Add validation schemas
- [ ] Phase 3: Split orders page component
- [ ] Phase 4: Extract utility functions
- [ ] Phase 4: Remove all `any` types

## Code Duplication Examples Found

### Example 1: Distance Calculation (Appears 3x)
```typescript
// In: location/route.ts, geofence/[orderId]/route.ts, orders/[orderId]/route.ts
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  // ... 10 more lines
}
```

### Example 2: Auth Pattern (Appears 15x+)
```typescript
// In: Every API route
const token = request.headers.get('authorization')?.replace('Bearer ', '');
if (!token) {
  return NextResponse.json({ error: 'Unauthorized', message: 'No token provided' }, { status: 401 });
}
const payload = verifyToken(token);
if (!payload) {
  return NextResponse.json({ error: 'Unauthorized', message: 'Invalid token' }, { status: 401 });
}
```

### Example 3: User Selection (Appears 6x+)
```typescript
// In: Multiple order routes
customer: {
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
  },
},
// ... and driver selection
driver: {
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
  },
}
```

## Testing Strategy Post-Refactoring

1. **Unit tests for utilities**
   - Distance calculations with known coordinates
   - CSV export formatting
   - Status color mapping

2. **Integration tests**
   - API auth pattern across routes
   - Error response consistency

3. **E2E tests**
   - Complete order flow
   - Tracking and geofencing
   - CSV export functionality

## Performance Expectations

- **Build time:** Minimal change (slight improvement from better organization)
- **Runtime:** No change (same logic, just organized better)
- **Bundle size:** Minimal impact
- **Database queries:** No change

## Migration Path

Since these are internal refactorings:
1. Create new utility files
2. Update imports one file at a time
3. Test each change
4. Remove old code after verification
5. No API changes needed

