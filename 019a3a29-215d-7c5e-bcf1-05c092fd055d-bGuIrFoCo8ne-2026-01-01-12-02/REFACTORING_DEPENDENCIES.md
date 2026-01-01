# Refactoring Dependency Graph

## Current State (Messy)
```
API Routes (15+ files)
├── Each has auth logic (repeated 15x)
├── Each has error handling (different formats)
└── Each has unique db selects
    └── Causes schema changes to affect many files

Tracking Routes (3 files)
├── location/route.ts - has distance calc
├── geofence/[orderId]/route.ts - has distance calc (duplicate)
└── orders/[orderId]/route.ts - has distance calc (duplicate)

Components
├── MapPicker.tsx - has leaflet config
├── LiveTrackingMap.tsx - has leaflet config (duplicate)
├── orders/page.tsx - has CSV export, filtering, sorting (362 lines)
└── driver/page.tsx - has filtering logic (216 lines)
```

## Target State (Clean)
```
/src/lib/
├── api-middleware.ts ←── Used by all API routes
├── api-responses.ts ←── Used by all API routes
├── db-selects.ts ←── Used by all database queries
├── geospatial.ts ←── Used by tracking routes
├── constants.ts ←── Used everywhere
├── validators.ts ←── Used by API input validation
├── csv-export.ts ←── Used by orders page
├── status-colors.ts ←── Used by UI components
├── map-config.ts ←── Used by map components
└── api-client.ts ←── Used by frontend pages

API Routes (15+ files - simplified)
├── auth/*.ts - uses api-middleware, api-responses
├── orders/*.ts - uses api-middleware, api-responses, db-selects, validators
├── tracking/*.ts - uses api-middleware, api-responses, geospatial
└── payments/*.ts - uses api-middleware, api-responses

Components
├── MapPicker.tsx - uses map-config
├── LiveTrackingMap.tsx - uses map-config
├── OrdersFilters.tsx (new)
├── OrdersList.tsx (new)
└── orders/page.tsx (simplified) - uses api-client, csv-export

Pages
├── orders/page.tsx - uses OrdersFilters, OrdersList, csv-export
├── driver/page.tsx - simplified with shared helpers
└── other pages - use api-client
```

## Refactoring Dependency Order

### Phase 1: Foundation (No dependencies)
```
Create:
1. /src/lib/constants.ts
2. /src/lib/geospatial.ts
3. /src/lib/db-selects.ts

Tests:
- geospatial calculations with known values
- db-selects generate correct Prisma queries
```

### Phase 2: API Infrastructure (Depends on Phase 1)
```
Create:
1. /src/lib/api-responses.ts
2. /src/lib/api-middleware.ts
3. /src/lib/validators.ts (uses constants)

Update:
- All 15+ API routes to use middleware

Tests:
- Auth middleware works with all route types
- Error responses consistent across routes
- Validation schemas catch invalid input
```

### Phase 3: Frontend Utilities (Depends on Phase 1)
```
Create:
1. /src/lib/status-colors.ts (uses constants)
2. /src/lib/map-config.ts
3. /src/lib/csv-export.ts
4. /src/lib/api-client.ts

Update:
- MapPicker.tsx to use map-config
- LiveTrackingMap.tsx to use map-config

Tests:
- CSV export maintains data integrity
- Status colors map correctly
```

### Phase 4: Component Refactoring (Depends on Phases 1-3)
```
Create:
1. /src/components/OrdersFilters.tsx
2. /src/components/OrdersList.tsx
3. /src/lib/orders-helpers.ts

Update:
- /src/app/orders/page.tsx (simplify)
- /src/app/driver/page.tsx (simplify)
- All pages using fetch to use api-client

Tests:
- Orders page still functional
- Filter/sort logic works
- Driver page still functional
```

## File Change Dependency Matrix

```
                              Phase 1   Phase 2   Phase 3   Phase 4
api-middleware.ts                ■         
api-responses.ts                 ■
constants.ts                      ■
geospatial.ts                     ■
db-selects.ts                     ■
validators.ts                     ■
api-client.ts                               ■
csv-export.ts                               ■
status-colors.ts                            ■
map-config.ts                               ■
Orders filters.tsx                                          ■
OrdersList.tsx                                              ■
auth routes                                 ■
orders routes                               ■
tracking routes                   ■          ■
payment routes                              ■
MapPicker.tsx                               ■
LiveTrackingMap.tsx                         ■
orders/page.tsx                                             ■
driver/page.tsx                                             ■
pages using fetch                                           ■
```

## Import Graph After Refactoring

```
AuthContext.tsx
└── api-client.ts
    └── api-responses.ts

/api/auth/login/route.ts
├── api-middleware.ts
├── api-responses.ts
├── validators.ts
└── prisma

/api/orders/route.ts
├── api-middleware.ts
├── api-responses.ts
├── db-selects.ts
├── constants.ts
├── validators.ts
└── prisma

/api/tracking/location/route.ts
├── api-middleware.ts
├── geospatial.ts
├── constants.ts
└── prisma

components/MapPicker.tsx
└── map-config.ts

components/LiveTrackingMap.tsx
├── map-config.ts
└── api-client.ts

app/orders/page.tsx
├── OrdersFilters.tsx
├── OrdersList.tsx
├── csv-export.ts
├── api-client.ts
└── status-colors.ts

app/driver/page.tsx
├── api-client.ts
└── constants.ts
```

## Critical Path for Fastest Implementation

**Minimum steps to get 80% of benefits:**

1. Extract geospatial (1 hour) - fixes 3 duplicate functions
2. Fix Prisma instances (30 min) - quick fix
3. Create api-middleware (2 hours) - reduces auth duplication
4. Create db-selects (1 hour) - reduces schema duplication
5. Standardize error responses (1.5 hours) - consistency

Total: ~6 hours = 200+ lines eliminated, 15+ files improved

**Optional but recommended:**

6. Extract constants (1 hour)
7. Split orders page (3 hours)
8. Add validators (2 hours)
9. Extract utilities (2 hours)

Total: ~8 more hours

## Risk Analysis

### Phase 1: LOW RISK
- New files only, no changes to existing code
- Can add to codebase incrementally

### Phase 2: LOW-MEDIUM RISK
- Updates existing files
- But changes are purely structural (imports only)
- Behavior remains identical
- Easy to revert if needed

### Phase 3: LOW RISK
- New utility files
- Cosmetic updates to components
- No behavior changes

### Phase 4: MEDIUM RISK
- Component restructuring
- Need to test orders page thoroughly
- Driver page testing required

**Mitigation:** Use feature branches, comprehensive testing after each phase

