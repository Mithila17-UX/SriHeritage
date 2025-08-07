# Firebase Index Setup for Forum

## Required Indexes

To ensure the forum functionality works properly, you need to create the following composite indexes in Firebase Firestore:

### 1. Forum Posts Index
**Collection:** `forum_posts`
**Fields:**
- `isDeleted` (Ascending)
- `createdAt` (Descending)

**Purpose:** For querying posts with pagination and filtering

### 2. Forum Posts with Category Index
**Collection:** `forum_posts`
**Fields:**
- `isDeleted` (Ascending)
- `category` (Ascending)
- `createdAt` (Descending)

**Purpose:** For filtering posts by category

### 3. Forum Posts with Site Index
**Collection:** `forum_posts`
**Fields:**
- `isDeleted` (Ascending)
- `siteId` (Ascending)
- `createdAt` (Descending)

**Purpose:** For filtering posts by site

### 4. Forum Posts with User Index
**Collection:** `forum_posts`
**Fields:**
- `isDeleted` (Ascending)
- `userId` (Ascending)
- `createdAt` (Descending)

**Purpose:** For filtering posts by user

### 5. Forum Posts Approval Index
**Collection:** `forum_posts`
**Fields:**
- `isApproved` (Ascending)
- `isDeleted` (Ascending)
- `createdAt` (Descending)

**Purpose:** For admin approval queries

### 6. Comments Index
**Collection:** `comments` (subcollection of `forum_posts`)
**Fields:**
- `isDeleted` (Ascending)
- `createdAt` (Ascending)

**Purpose:** For querying comments with ordering

## How to Create Indexes

### Method 1: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sriheritage-b77b3`
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Add the indexes listed above

### Method 2: Using the Direct Link

You can use the direct link from the error message to create the specific index:

```
https://console.firebase.google.com/v1/r/project/sriheritage-b77b3/firestore/indexes?create_composite=ClJwcm9qZWN0cy9zcmloZXJpdGFnZS1iNzdiMy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY29tbWVudHMvaW5kZXhlcy9fEAEaDQoJaXNEZWxldGVkEAEaDQoJY3JlYXRlZEF0EAEaDAoIX19uYW1lX18QAQ
```

### Method 3: Using Firebase CLI

If you have Firebase CLI installed, you can create indexes using the `firestore:indexes` command:

```bash
# Create a firestore.indexes.json file
{
  "indexes": [
    {
      "collectionGroup": "forum_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isDeleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "forum_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isDeleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "forum_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isDeleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "forum_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isDeleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "forum_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isApproved",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isDeleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

## Index Status

After creating indexes, they will show as **Building** status. This can take a few minutes to complete. Once the status changes to **Enabled**, the queries will work properly.

## Temporary Workaround

Until the indexes are created, the forum service has been updated to use a fallback approach:

1. **For Comments**: The service now tries a simpler query first, and if that fails, it falls back to fetching all comments and filtering/sorting in memory.

2. **For Posts**: The service uses optimized queries that should work without complex indexes.

## Monitoring

You can monitor index usage and performance in the Firebase Console under:
- **Firestore Database** → **Usage** tab
- **Firestore Database** → **Indexes** tab

## Troubleshooting

### Common Issues:

1. **Index Building Failed**: 
   - Check if the collection exists
   - Verify field names match exactly
   - Ensure data types are consistent

2. **Query Still Failing**:
   - Wait for index to finish building
   - Check if the index is enabled
   - Verify the query matches the index exactly

3. **Performance Issues**:
   - Monitor index usage
   - Consider adding more specific indexes
   - Optimize queries to use existing indexes

## Cost Considerations

- **Index Storage**: Each index consumes storage space
- **Index Maintenance**: Firebase automatically maintains indexes
- **Query Costs**: Properly indexed queries are more cost-effective

## Best Practices

1. **Create Indexes Early**: Set up indexes before deploying to production
2. **Monitor Usage**: Keep track of which indexes are actually used
3. **Optimize Queries**: Design queries to use existing indexes
4. **Remove Unused Indexes**: Delete indexes that are no longer needed

## Support

If you encounter issues with index creation or queries:

1. Check the Firebase Console for error messages
2. Review the Firestore documentation
3. Test queries in the Firebase Console
4. Monitor index building progress

The forum should work properly once the required indexes are created and enabled.
