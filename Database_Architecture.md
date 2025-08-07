# Sri Heritage App - Database Architecture

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        string uid PK
        string email
        string displayName
        string photoURL
        timestamp createdAt
        timestamp lastLoginAt
        boolean isAdmin
        string[] favoriteSites
        string[] visitedSites
        string[] plannedSites
    }
    
    HERITAGE_SITES {
        string id PK
        string name
        string description
        string location
        number latitude
        number longitude
        string category
        string image_url
        string[] gallery
        string openingHours
        string entranceFee
        number rating
        string historicalPeriod
        string significance
        string district
        string distance
        timestamp createdAt
        timestamp updatedAt
        string createdBy
        boolean isActive
    }
    
    CHAT_SESSIONS {
        string sessionId PK
        string userId FK
        string title
        message[] messages
        timestamp createdAt
        timestamp updatedAt
        boolean isActive
    }
    
    CHAT_MESSAGES {
        string messageId PK
        string sessionId FK
        string content
        string role
        timestamp timestamp
        boolean isLoading
    }
    
    REVIEWS {
        string reviewId PK
        string siteId FK
        string userId FK
        string author
        string avatar
        number rating
        string comment
        number helpful
        aspectRating[] aspectRatings
        timestamp createdAt
        timestamp updatedAt
    }
    
    FORUM_POSTS {
        string postId PK
        string userId FK
        string title
        string content
        string[] tags
        number likes
        number views
        timestamp createdAt
        timestamp updatedAt
        boolean isActive
    }
    
    FORUM_COMMENTS {
        string commentId PK
        string postId FK
        string userId FK
        string content
        number likes
        timestamp createdAt
        timestamp updatedAt
    }
    
    ADMIN_LOGS {
        string logId PK
        string adminId FK
        string action
        string siteId FK
        string siteName
        string details
        timestamp timestamp
        string adminEmail
    }
    
    IMAGE_UPLOADS {
        string imageId PK
        string siteId FK
        string url
        string filename
        number size
        string mimeType
        timestamp uploadedAt
        string uploadedBy
    }
    
    USER_PROFILES {
        string userId PK
        string displayName
        string bio
        string avatar
        string[] interests
        number totalVisits
        number totalReviews
        timestamp profileCreatedAt
        timestamp lastActivityAt
    }

    %% Relationships
    USERS ||--o{ HERITAGE_SITES : "manages (admin)"
    USERS ||--o{ CHAT_SESSIONS : "creates"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ FORUM_POSTS : "creates"
    USERS ||--o{ FORUM_COMMENTS : "writes"
    USERS ||--o{ ADMIN_LOGS : "performs"
    USERS ||--o{ IMAGE_UPLOADS : "uploads"
    USERS ||--|| USER_PROFILES : "has"
    
    HERITAGE_SITES ||--o{ REVIEWS : "receives"
    HERITAGE_SITES ||--o{ IMAGE_UPLOADS : "contains"
    HERITAGE_SITES ||--o{ ADMIN_LOGS : "tracked_in"
    
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"
    
    FORUM_POSTS ||--o{ FORUM_COMMENTS : "has"
```

## 2. Firestore Collections Structure

### 2.1 Core Collections

```mermaid
graph TB
    subgraph "Firestore Collections"
        subgraph "Authentication"
            AUTH[users]
            AUTH_PROFILES[user_profiles]
        end
        
        subgraph "Content Management"
            SITES[sites]
            IMAGES[images]
            GALLERIES[galleries]
        end
        
        subgraph "User Interactions"
            CHAT_SESSIONS[chat_sessions]
            REVIEWS[reviews]
            FAVORITES[favorites]
            VISITS[visits]
        end
        
        subgraph "Community"
            FORUM_POSTS[forum_posts]
            FORUM_COMMENTS[forum_comments]
            FORUM_LIKES[forum_likes]
        end
        
        subgraph "Admin & Analytics"
            ADMIN_LOGS[admin_logs]
            ANALYTICS[analytics]
            SETTINGS[settings]
        end
        
        subgraph "System"
            METADATA[metadata]
            CACHE[cache]
            SYNC[sync_queue]
        end
    end
```

### 2.2 Detailed Collection Schemas

#### Sites Collection
```javascript
// Collection: sites
{
  "id": "string (auto-generated)",
  "name": "string (required)",
  "description": "string (required)",
  "location": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)",
  "category": "string (required)",
  "image_url": "string (optional)",
  "gallery": ["string"] (optional),
  "openingHours": "string (optional)",
  "entranceFee": "string (optional)",
  "rating": "number (default: 4.5)",
  "historicalPeriod": "string (optional)",
  "significance": "string (optional)",
  "district": "string (optional)",
  "distance": "string (optional)",
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string (user ID)",
  "isActive": "boolean (default: true)"
}
```

#### Chat Sessions Collection
```javascript
// Collection: chat_sessions
{
  "sessionId": "string (auto-generated)",
  "userId": "string (required)",
  "title": "string (required)",
  "messages": [
    {
      "id": "string",
      "content": "string",
      "role": "user|bot",
      "timestamp": "timestamp",
      "isLoading": "boolean"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "isActive": "boolean (default: true)"
}
```

#### Reviews Collection
```javascript
// Collection: reviews
{
  "reviewId": "string (auto-generated)",
  "siteId": "string (required)",
  "userId": "string (required)",
  "author": "string (required)",
  "avatar": "string (optional)",
  "rating": "number (1-5, required)",
  "comment": "string (optional)",
  "helpful": "number (default: 0)",
  "aspectRatings": [
    {
      "aspect": "string",
      "rating": "number",
      "icon": "string"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Admin Logs Collection
```javascript
// Collection: admin_logs
{
  "logId": "string (auto-generated)",
  "adminId": "string (required)",
  "action": "add|edit|delete|login|logout|backup|settings_change",
  "siteId": "string (optional)",
  "siteName": "string (optional)",
  "details": "string (optional)",
  "timestamp": "timestamp",
  "adminEmail": "string (optional)"
}
```

## 3. Database Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        RN[React Native App]
        WEB[Web Admin Panel]
    end
    
    subgraph "API Layer"
        FIREBASE[Firebase SDK]
        REST[REST APIs]
    end
    
    subgraph "Firebase Services"
        AUTH[Firebase Auth]
        FIRESTORE[Cloud Firestore]
        STORAGE[Firebase Storage]
        FUNCTIONS[Cloud Functions]
    end
    
    subgraph "External Services"
        IMGBB[ImgBB API]
        UNSPLASH[Unsplash API]
        DEEPSEEK[DeepSeek R1 API]
        GOOGLE_MAPS[Google Maps API]
    end
    
    subgraph "Local Storage"
        ASYNC[AsyncStorage]
        CACHE[Local Cache]
    end
    
    %% Connections
    RN --> FIREBASE
    WEB --> FIREBASE
    FIREBASE --> AUTH
    FIREBASE --> FIRESTORE
    FIREBASE --> STORAGE
    FIREBASE --> FUNCTIONS
    
    FIRESTORE --> IMGBB
    FIRESTORE --> UNSPLASH
    FIRESTORE --> DEEPSEEK
    FIRESTORE --> GOOGLE_MAPS
    
    RN --> ASYNC
    RN --> CACHE
```

## 4. Data Flow Diagrams

### 4.1 Site Data Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant AP as Admin Panel
    participant F as Firebase
    participant S as Storage
    participant I as ImgBB
    
    A->>AP: Add New Site
    AP->>I: Upload Images
    I-->>AP: Image URLs
    AP->>F: Save Site Data
    F-->>AP: Site Created
    AP-->>A: Success Confirmation
    
    Note over F: Data Replication
    F->>F: Update Indexes
    F->>F: Cache Invalidation
```

### 4.2 Chat Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as ChatScreen
    participant F as Firestore
    participant AI as DeepSeek API
    participant CH as Chat History
    
    U->>C: Send Message
    C->>F: Save User Message
    C->>AI: Send to AI
    AI-->>C: AI Response
    C->>F: Save AI Response
    C->>CH: Update Session
    C-->>U: Display Response
```

### 4.3 Image Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant I as ImagePicker
    participant M as ImageManipulator
    participant IMG as ImgBB
    participant F as Firestore
    
    U->>I: Select Image
    I-->>U: Image URI
    U->>M: Compress/Resize
    M-->>U: Processed Image
    U->>IMG: Upload to ImgBB
    IMG-->>U: Image URL
    U->>F: Save URL to Firestore
    F-->>U: Confirmation
```

## 5. Indexing Strategy

### 5.1 Firestore Indexes

```javascript
// Composite Indexes for Performance

// Sites Collection
{
  "collection": "sites",
  "fields": [
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "rating", "order": "DESCENDING" }
  ]
}

{
  "collection": "sites", 
  "fields": [
    { "fieldPath": "district", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
}

// Chat Sessions Collection
{
  "collection": "chat_sessions",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}

// Reviews Collection
{
  "collection": "reviews",
  "fields": [
    { "fieldPath": "siteId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}

// Admin Logs Collection
{
  "collection": "admin_logs",
  "fields": [
    { "fieldPath": "adminId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

## 6. Security Rules

### 6.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sites are publicly readable, only admins can write
    match /sites/{siteId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['admin@sriheritage.com', 'admin@sriheritage'];
    }
    
    // Chat sessions are user-specific
    match /chat_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Reviews are publicly readable, authenticated users can write
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Admin logs are admin-only
    match /admin_logs/{logId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email in ['admin@sriheritage.com', 'admin@sriheritage'];
    }
  }
}
```

### 6.2 Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Site images are publicly readable
    match /sites/{siteId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['admin@sriheritage.com', 'admin@sriheritage'];
    }
    
    // User uploads are user-specific
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## 7. Data Backup & Recovery

### 7.1 Backup Strategy

```mermaid
graph LR
    subgraph "Primary Storage"
        FIRESTORE[Cloud Firestore]
        STORAGE[Firebase Storage]
    end
    
    subgraph "Backup Storage"
        EXPORT[Firestore Export]
        STORAGE_BACKUP[Storage Backup]
    end
    
    subgraph "Recovery"
        RESTORE[Data Restore]
        VALIDATE[Data Validation]
    end
    
    FIRESTORE --> EXPORT
    STORAGE --> STORAGE_BACKUP
    EXPORT --> RESTORE
    STORAGE_BACKUP --> RESTORE
    RESTORE --> VALIDATE
```

### 7.2 Backup Schedule

- **Daily**: Automated Firestore export
- **Weekly**: Full system backup including Storage
- **Monthly**: Cross-region backup replication
- **On-Demand**: Before major updates

## 8. Performance Optimization

### 8.1 Query Optimization

```javascript
// Optimized Queries

// 1. Pagination for Sites
const getSitesPaginated = async (limit = 20, lastDoc = null) => {
  let query = collection(firestore, 'sites')
    .where('isActive', '==', true)
    .orderBy('rating', 'desc')
    .limit(limit);
    
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return getDocs(query);
};

// 2. Geospatial Queries
const getNearbySites = async (lat, lng, radius = 10) => {
  // Use GeoFirestore or implement custom geohashing
  const sites = await getSitesFromFirestore();
  return sites.filter(site => {
    const distance = calculateDistance(lat, lng, site.latitude, site.longitude);
    return distance <= radius;
  });
};

// 3. Search with Full-Text
const searchSites = async (searchTerm) => {
  const sites = await getSitesFromFirestore();
  return sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
```

### 8.2 Caching Strategy

```javascript
// Local Caching Implementation

class CacheManager {
  static async cacheSites(sites) {
    await AsyncStorage.setItem('cached_sites', JSON.stringify(sites));
    await AsyncStorage.setItem('sites_cache_timestamp', Date.now().toString());
  }
  
  static async getCachedSites() {
    const cached = await AsyncStorage.getItem('cached_sites');
    const timestamp = await AsyncStorage.getItem('sites_cache_timestamp');
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < 24 * 60 * 60 * 1000) { // 24 hours
        return JSON.parse(cached);
      }
    }
    return null;
  }
}
```

## 9. Monitoring & Analytics

### 9.1 Key Metrics

- **User Engagement**: Daily/Monthly Active Users
- **Content Performance**: Site views, favorites, reviews
- **System Performance**: Query response times, error rates
- **Storage Usage**: Database size, storage consumption
- **API Usage**: External API calls and costs

### 9.2 Monitoring Dashboard

```mermaid
graph TB
    subgraph "Real-time Monitoring"
        METRICS[Key Metrics]
        ALERTS[Alert System]
        LOGS[Error Logs]
    end
    
    subgraph "Analytics"
        USER_ANALYTICS[User Analytics]
        CONTENT_ANALYTICS[Content Analytics]
        PERFORMANCE[Performance Metrics]
    end
    
    subgraph "Reporting"
        DAILY[Daily Reports]
        WEEKLY[Weekly Reports]
        MONTHLY[Monthly Reports]
    end
    
    METRICS --> ALERTS
    METRICS --> LOGS
    METRICS --> USER_ANALYTICS
    METRICS --> CONTENT_ANALYTICS
    METRICS --> PERFORMANCE
    USER_ANALYTICS --> DAILY
    CONTENT_ANALYTICS --> WEEKLY
    PERFORMANCE --> MONTHLY
```

This comprehensive database architecture provides a scalable, secure, and performant foundation for the Sri Heritage App, supporting all current features while allowing for future expansion. 