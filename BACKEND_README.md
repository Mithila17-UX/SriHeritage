# Sri Heritage App - Backend Implementation

This document describes the comprehensive backend implementation for the Sri Heritage App, featuring a hybrid offline-first architecture with SQLite and Firebase integration.

## Architecture Overview

The backend follows a hybrid approach:
- **SQLite (expo-sqlite)**: Primary data storage for offline-first functionality
- **Firebase Auth**: User authentication and management
- **Firebase Firestore**: Cloud sync and forum functionality
- **AsyncStorage**: User preferences and app state

## File Structure

```
services/
├── database.ts        # SQLite database service
├── firebase.ts        # Firebase configuration
├── auth.ts           # Authentication service
├── sync.ts           # Synchronization service
└── index.ts          # Service exports and initialization

hooks/
├── useSites.ts       # Site-related hooks
└── useForum.ts       # Forum-related hooks
```

## Services

### 1. Database Service (`services/database.ts`)

Manages SQLite database operations for offline-first functionality.

#### Database Schema

**sites**
- `id`: Primary key
- `name`: Site name
- `description`: Detailed description
- `location`: Location name
- `latitude`, `longitude`: GPS coordinates
- `category`: Site category
- `image_url`: Image URL
- `historical_period`: Historical period
- `significance`: Cultural significance
- `visiting_hours`: Operating hours
- `entry_fee`: Entry fee information
- `created_at`, `updated_at`: Timestamps

**favorite_sites**
- `id`: Primary key
- `user_id`: Firebase user ID
- `site_id`: Reference to sites table
- `created_at`: Timestamp

**visited_sites**
- `id`: Primary key
- `user_id`: Firebase user ID
- `site_id`: Reference to sites table
- `visited_at`: Visit timestamp
- `notes`: Optional visit notes

#### Key Methods

```typescript
// Site operations
await databaseService.getAllSites()
await databaseService.getSiteById(id)
await databaseService.searchSites(query)
await databaseService.getSitesByCategory(category)

// Favorites
await databaseService.addFavoriteSite(userId, siteId)
await databaseService.removeFavoriteSite(userId, siteId)
await databaseService.getFavoriteSites(userId)
await databaseService.isSiteFavorited(userId, siteId)

// Visited sites
await databaseService.addVisitedSite(userId, siteId, notes?)
await databaseService.removeVisitedSite(userId, siteId)
await databaseService.getVisitedSites(userId)
await databaseService.isSiteVisited(userId, siteId)
```

### 2. Authentication Service (`services/auth.ts`)

Handles Firebase Authentication with React Native persistence.

#### Key Methods

```typescript
// Authentication
await authService.signUp({ email, password, displayName? })
await authService.signIn({ email, password })
await authService.signOut()
await authService.sendPasswordResetEmail(email)

// User management
authService.getCurrentUser()
authService.getCurrentUserId()
await authService.getUserProfile(uid?)
await authService.updateUserProfile({ displayName?, photoURL? })

// State management
authService.onAuthStateChanged(callback)
authService.isAuthenticated()
```

### 3. Sync Service (`services/sync.ts`)

Manages data synchronization between SQLite and Firestore, plus forum functionality.

#### Sync Operations

```typescript
// Data synchronization
await syncService.performFullSync()
await syncService.syncFavoritesToFirestore(userId)
await syncService.syncVisitedToFirestore(userId)
await syncService.syncFavoritesFromFirestore(userId)
await syncService.syncVisitedFromFirestore(userId)
```

#### Forum Operations

```typescript
// Forum posts
await syncService.createForumPost(postData)
await syncService.getForumPosts(category?, siteId?)
await syncService.getForumPost(postId)
await syncService.updateForumPost(postId, updates)
await syncService.deleteForumPost(postId)
await syncService.likeForumPost(postId, userId)
await syncService.unlikeForumPost(postId, userId)

// Forum comments
await syncService.createForumComment(postId, commentData)
await syncService.getForumComments(postId)
await syncService.deleteForumComment(postId, commentId)
```

### 4. App Services (`services/index.ts`)

Centralizes service initialization and management.

```typescript
import { appServices } from './services';

// Initialize all services
await appServices.initialize();
```

## React Hooks

### Site Hooks (`hooks/useSites.ts`)

```typescript
// Sites management
const { sites, loading, error, loadSites, searchSites, getSitesByCategory } = useSites();

// Favorites management
const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

// Visited sites management
const { visited, addVisited, removeVisited, isVisited } = useVisited();
```

### Forum Hooks (`hooks/useForum.ts`)

```typescript
// Forum posts
const { posts, createPost, likePost, deletePost } = useForum(category?, siteId?);

// Forum comments
const { comments, createComment, deleteComment } = useForumComments(postId);

// Single post
const { post, loading, error } = useForumPost(postId);
```

## Firebase Configuration

The app uses the provided Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAdXUZNOdmC4JGerYedKse4--i4Xw-mKlU",
  authDomain: "sriheritage-b77b3.firebaseapp.com",
  projectId: "sriheritage-b77b3",
  storageBucket: "sriheritage-b77b3.firebasestorage.app",
  messagingSenderId: "900546875634",
  appId: "1:900546875634:web:74f3b5565c9e681f61406b",
  measurementId: "G-YCQS4637D2"
};
```

## Firestore Collections

### users
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: string,
  lastLoginAt: string,
  favoriteSites: number[],
  visitedSites: { site_id: number, visited_at: string, notes?: string }[],
  favoritesLastSynced: string,
  visitedLastSynced: string
}
```

### forums
```typescript
{
  userId: string,
  userName: string,
  userAvatar?: string,
  title: string,
  content: string,
  category: string,
  siteId?: number,
  siteName?: string,
  likes: number,
  likedBy: string[],
  commentsCount: number,
  createdAt: string,
  updatedAt: string
}
```

### forums/{postId}/comments
```typescript
{
  postId: string,
  userId: string,
  userName: string,
  userAvatar?: string,
  content: string,
  likes: number,
  likedBy: string[],
  createdAt: string,
  updatedAt: string
}
```

## Usage Examples

### Basic Authentication

```typescript
import { authService } from './services';

// Sign up
try {
  await authService.signUp({
    email: 'user@example.com',
    password: 'password123',
    displayName: 'John Doe'
  });
} catch (error) {
  console.error('Signup failed:', error.message);
}

// Sign in
try {
  await authService.signIn({
    email: 'user@example.com',
    password: 'password123'
  });
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Site Management

```typescript
import { useSites, useFavorites } from './hooks/useSites';

function SitesList() {
  const { sites, loading, searchSites } = useSites();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleSearch = (query: string) => {
    searchSites(query);
  };

  const toggleFavorite = async (siteId: number) => {
    const favorited = await isFavorite(siteId);
    if (favorited) {
      await removeFavorite(siteId);
    } else {
      await addFavorite(siteId);
    }
  };

  // Component JSX...
}
```

### Forum Integration

```typescript
import { useForum, useForumComments } from './hooks/useForum';

function ForumScreen() {
  const { posts, createPost, likePost } = useForum();

  const handleCreatePost = async (postData) => {
    try {
      await createPost({
        title: 'New Post',
        content: 'Post content...',
        category: 'General Discussion'
      });
    } catch (error) {
      console.error('Failed to create post:', error.message);
    }
  };

  // Component JSX...
}
```

## Offline-First Strategy

1. **Primary Storage**: SQLite stores all site data locally
2. **User Data**: Favorites and visited sites stored locally with user ID
3. **Sync Strategy**: Periodic sync to Firestore when online
4. **Conflict Resolution**: Last-write-wins for user preferences
5. **Forum Data**: Online-only (requires internet connection)

## Error Handling

All services implement comprehensive error handling:

```typescript
try {
  await databaseService.addFavoriteSite(userId, siteId);
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    // Already favorited
  } else {
    // Handle other errors
    console.error('Database error:', error);
  }
}
```

## Performance Considerations

1. **Database Indexes**: Key columns are indexed for fast queries
2. **Batch Operations**: Bulk sync operations for efficiency
3. **Background Sync**: Non-blocking sync operations
4. **Connection Awareness**: Sync only when online
5. **Lazy Loading**: Load data as needed

## Security

1. **Firebase Security Rules**: Implement Firestore security rules
2. **User Data Isolation**: Users can only access their own data
3. **Input Validation**: All inputs validated before database operations
4. **Error Sanitization**: Sensitive information not exposed in errors

## Testing

The backend services can be tested independently:

```typescript
import { databaseService } from './services';

// Test database operations
await databaseService.initializeDatabase();
const sites = await databaseService.getAllSites();
console.log('Loaded sites:', sites.length);
```

## Deployment Notes

1. **Firebase Setup**: Ensure Firebase project is properly configured
2. **Firestore Rules**: Deploy security rules for production
3. **App Configuration**: Update Firebase config for production
4. **Database Migration**: Handle schema changes gracefully

This backend implementation provides a robust, scalable foundation for the Sri Heritage App with full offline support and cloud synchronization capabilities.