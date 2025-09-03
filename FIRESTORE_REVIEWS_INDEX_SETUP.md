# Firestore Index Setup for Reviews System

## Issue
The reviews system requires a composite index for optimal query performance when filtering by `siteId` and ordering by `createdAt`.

## Error Message
```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/sriheritage-b77b3/firestore/indexes?create_composite=...
```

## Current Solution
The review service has been updated with a fallback mechanism that:
1. **First attempts** to use the composite index query (with ordering)
2. **Falls back** to a simple query without ordering if index is not available
3. **Manually sorts** results on the client side

## Creating the Composite Index

### Option 1: Automatic Creation (Recommended)
1. **Trigger the index creation** by running the app and accessing the reviews section
2. **Click the index creation link** provided in the error message
3. **Firebase Console will open** with the index pre-configured
4. **Click "Create Index"** and wait for it to build (usually takes a few minutes)

### Option 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sriheritage-b77b3`
3. Navigate to **Firestore Database**
4. Go to **Indexes** tab
5. Click **Create Index**
6. Configure the composite index:

```
Collection ID: reviews
Fields:
  - siteId (Ascending)
  - createdAt (Descending)
  - __name__ (Ascending)
Query scopes: Collection
```

### Option 3: Firebase CLI (Advanced)
Add to your `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

## Additional Recommended Indexes

For optimal performance, consider creating these additional indexes:

### 1. User Reviews Index
```
Collection: reviews
Fields:
  - userId (Ascending)
  - siteId (Ascending)
  - createdAt (Descending)
```

### 2. Rating Statistics Index
```
Collection: siteRatings
Fields:
  - averageRating (Descending)
  - totalReviews (Descending)
```

## Firestore Rules Update

Ensure your Firestore rules allow proper access to the reviews collection:

```javascript
// Add to firestore.rules
match /reviews/{reviewId} {
  // Allow read access to all authenticated users
  allow read: if request.auth != null;
  
  // Allow write access only to the review author
  allow create: if request.auth != null 
    && request.auth.uid == resource.data.userId;
  
  allow update, delete: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}

match /siteRatings/{siteId} {
  // Allow read access to all authenticated users
  allow read: if request.auth != null;
  
  // Allow write access for updating rating statistics
  // (This should be done server-side in production)
  allow write: if request.auth != null;
}
```

## Performance Considerations

### Without Index (Current Fallback)
- ✅ **Works immediately** without waiting for index creation
- ⚠️ **Client-side sorting** - uses more bandwidth and processing
- ⚠️ **Limited scalability** for large numbers of reviews

### With Index (Optimal)
- ✅ **Server-side sorting** - efficient and fast
- ✅ **Scalable** for any number of reviews
- ✅ **Optimized bandwidth** usage
- ⏳ **Requires index creation time** (5-15 minutes)

## Monitoring Index Status

1. Go to Firebase Console > Firestore > Indexes
2. Check the status of your indexes:
   - 🟡 **Building** - Index is being created
   - 🟢 **Enabled** - Index is ready for use
   - 🔴 **Error** - Index creation failed

## Testing the Fix

1. **Before Index**: App works with manual sorting
2. **During Index Building**: App continues to work with fallback
3. **After Index Complete**: App automatically uses optimized query

## Code Changes Made

### reviewService.ts
- Added fallback mechanism for index-dependent queries
- Implemented client-side sorting when index unavailable
- Added proper error handling and logging

### Query Strategy
```typescript
// Attempt optimized query with index
try {
  const optimizedQuery = query(
    collection(firestore, 'reviews'),
    where('siteId', '==', siteId),
    orderBy('createdAt', 'desc')
  );
  // Use optimized query
} catch (indexError) {
  // Fallback to simple query
  const simpleQuery = query(
    collection(firestore, 'reviews'),
    where('siteId', '==', siteId)
  );
  // Sort manually after fetching
}
```

## Next Steps

1. **Create the composite index** using one of the methods above
2. **Wait for index to build** (check status in Firebase Console)
3. **Test the reviews functionality** - it should work immediately
4. **Monitor performance** once index is active

The reviews system will work immediately with the fallback mechanism, and performance will improve once the index is created.
