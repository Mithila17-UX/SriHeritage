# Distance Calculation and Zero Leak Fix

## Summary of Changes

This fix addresses two main issues:
1. **Zero Leak Prevention**: Raw `0` values were being rendered when `distanceKm` was 0 due to truthy evaluation
2. **Distance Calculation**: Added proper geographic distance calculation using Haversine formula

## Files Changed

### 1. `/utils/geo.ts` (NEW)
- **Added**: `kmBetween()` - Haversine distance calculation function
- **Added**: `siteToCoords()` - Helper to convert Site objects to coordinate format
- **Purpose**: Pure utility functions for geographic calculations

### 2. `/components/AdminNearbyEditor.tsx` (MODIFIED)
#### Props Interface Updates:
- **Added**: `origin?: { lat: number; lng: number }` - Current site coordinates for distance calculation
- **Added**: `onRecalculateDistances?: (recalc: () => void) => void` - Callback for distance recalculation

#### Zero Leak Fixes:
```tsx
// BEFORE (leaked 0 when distanceKm was 0):
{item.distanceKm && getDistanceWarning(item.distanceKm) && (
  <Text style={styles.warningText}>{getDistanceWarning(item.distanceKm)}</Text>
)}

// AFTER (safe boolean guard):
{item.distanceKm != null && item.distanceKm > 0 && !!getDistanceWarning(item.distanceKm) && (
  <Text style={styles.warningText}>{getDistanceWarning(item.distanceKm)}</Text>
)}
```

#### Distance Display Formatting:
```tsx
// BEFORE:
{item.distanceKm !== undefined && (
  <Badge variant="outline" style={styles.distanceBadge}>
    {item.distanceKm} km
  </Badge>
)}

// AFTER (formatted with decimal precision):
{item.distanceKm != null && (
  <Badge variant="outline" style={styles.distanceBadge}>
    {`${Number(item.distanceKm).toFixed(1)} km`}
  </Badge>
)}
```

#### Distance Calculation Integration:
- **Modified**: `handleAddSite()` now calculates real distances when adding sites
- **Added**: `useEffect()` for recalculation callback registration
- **Uses**: Geographic coordinates from Site objects to compute actual km distances

### 3. `/.eslintrc.js` (MODIFIED)
- **Added**: `'no-constant-binary-expression': 'error'` rule to catch potential issues

### 4. `/__tests__/GeoAndZeroLeak.test.tsx` (NEW)
- **Added**: Test utilities for verifying distance calculations
- **Added**: Component demonstrating zero leak prevention

## Technical Details

### Distance Calculation
- Uses Haversine formula for accurate geographic distance calculation
- Handles both `site.latitude/longitude` and `site.coordinates.latitude/longitude` formats
- Returns distances in kilometers with 2 decimal precision
- Gracefully handles missing coordinates (defaults to 0)

### Zero Leak Prevention
The key insight is that in JavaScript:
```javascript
0 && <Component /> // Renders literal "0" 
false && <Component /> // Renders nothing
```

Fixed by using explicit comparisons:
```javascript
value != null && value > 0 && <Component /> // Safe
Boolean(value) && <Component /> // Also safe
```

### Backward Compatibility
- All existing props and interfaces preserved
- New props are optional with sensible defaults
- Component behavior unchanged when new props not provided
- TypeScript types maintained

## Usage Examples

### With Distance Calculation:
```tsx
<AdminNearbyEditor
  value={nearbyItems}
  onChange={setNearbyItems}
  title="Nearby Attractions"
  origin={{ lat: 6.9271, lng: 79.8612 }} // Colombo coordinates
  onRecalculateDistances={(recalc) => {
    // Store recalc function for button click
    recalculateRef.current = recalc;
  }}
/>
```

### Without Distance Calculation (backward compatible):
```tsx
<AdminNearbyEditor
  value={nearbyItems}
  onChange={setNearbyItems}
  title="Nearby Attractions"
  // Works exactly as before
/>
```

## Verification

To verify the fixes:
1. **Zero Leak**: Items with `distanceKm: 0` no longer show stray "0" in UI
2. **Distance Calculation**: Real distances appear when origin coordinates provided
3. **Formatting**: Distances show as "1.5 km" instead of raw numbers
4. **Recalculation**: Parent components can trigger distance updates

## Performance Considerations

- Distance calculations are only performed when adding sites or explicitly recalculating
- Coordinate conversion is memoized within the same operation
- Database calls for recalculation are batched with Promise.all()
- Graceful error handling prevents calculation failures from breaking the UI
