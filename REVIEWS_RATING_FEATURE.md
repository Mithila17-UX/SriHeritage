# Reviews & Ratings Feature Documentation

## Overview
A comprehensive reviews and ratings system has been added to the SiteInformationPage component, allowing authenticated users to submit, edit, and delete reviews for heritage sites.

## Features

### 1. **Rating System**
- 5-star rating system for overall site rating
- Aspect-based ratings for specific categories:
  - Cleanliness 🧹
  - Accessibility ♿
  - Historical Value 🏛️
  - Photography 📸
  - Facilities 🚻
  - Crowd Level 👥

### 2. **Review Management**
- **Add Reviews**: Authenticated users can write new reviews
- **Edit Reviews**: Users can edit their own reviews
- **Delete Reviews**: Users can delete their own reviews
- **Character Limit**: Reviews limited to 500 characters
- **Real-time Updates**: Reviews sync with Firestore in real-time

### 3. **Rating Calculation**
- Automatic calculation of average ratings
- Total review count tracking
- Rating statistics stored and updated in Firestore

### 4. **User Experience**
- **Authentication Required**: Users must be logged in to submit reviews
- **One Review Per User**: Each user can only have one review per site
- **Helpful Button**: Users can mark other reviews as helpful
- **Visual Feedback**: Clear indication of user's existing reviews

## Technical Implementation

### Services Used
- **Firebase Firestore**: Database for storing reviews and ratings
- **Authentication Service**: User management and authorization
- **Review Service**: Complete CRUD operations for reviews

### Data Structure

#### Review Document
```typescript
{
  id: string;
  siteId: number;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  rating: number; // 1-5
  comment: string;
  aspectRatings: Record<string, number>; // Optional aspect ratings
  createdAt: Date;
  updatedAt: Date;
  helpful: number; // Count of helpful votes
}
```

#### Site Rating Statistics
```typescript
{
  siteId: number;
  averageRating: number;
  totalReviews: number;
  totalRatingSum: number;
  lastUpdated: Date;
}
```

### Firestore Collections
- `reviews` - Stores individual user reviews
- `siteRatings` - Stores aggregated rating statistics for each site

## User Interface Components

### 1. **Star Rating Component**
- Interactive 5-star rating system
- Configurable size and edit mode
- Visual feedback with gold stars

### 2. **Review Form Modal**
- Full-screen modal for writing/editing reviews
- Overall rating selection
- Comment text area with character count
- Aspect-based rating options
- Submit/Cancel actions

### 3. **Reviews Display**
- Overall rating summary with average score
- User's existing review (if any) with edit option
- Recent reviews from other users
- Helpful vote functionality

### 4. **Add Review Section**
- Prominent "Write a Review" button for new users
- Authentication prompt for non-logged users
- Edit button for users with existing reviews

## Security & Validation

### Client-side Validation
- Rating must be between 1-5 stars
- Comment must be at least 10 characters
- Maximum 500 characters for comments

### Server-side Security
- User authentication required
- Users can only edit/delete their own reviews
- Firestore security rules protect data integrity

### Error Handling
- Network error handling
- User-friendly error messages
- Loading states for better UX

## Usage Example

```typescript
// The component automatically handles review functionality
<SiteInformationPage 
  site={siteData}
  isFavorite={false}
  isVisited={false}
  isPlanned={false}
  offlineMode={false}
  onToggleFavorite={() => {}}
  onVisitStatusChange={() => {}}
  onBack={() => {}}
/>
```

## Authentication Integration

The review system integrates with the existing authentication service:
- Automatically loads user reviews on component mount
- Clears review data when user logs out
- Shows appropriate UI based on authentication state

## Real-time Updates

The system supports real-time updates using Firestore listeners:
- New reviews appear immediately
- Rating calculations update automatically
- Helpful vote counts refresh in real-time

## Performance Considerations

- Reviews are loaded on-demand
- Pagination support for large review sets
- Efficient Firestore queries with proper indexing
- Optimistic UI updates for better performance

## Future Enhancements

Potential improvements for the review system:
1. Image uploads in reviews
2. Reply to reviews functionality
3. Advanced filtering and sorting options
4. Review moderation tools
5. Spam detection and prevention
6. Export reviews functionality
7. Review analytics dashboard

## Error Scenarios Handled

1. **Network Issues**: Graceful fallback with error messages
2. **Authentication Errors**: Clear prompts to log in
3. **Permission Errors**: User-friendly access denied messages
4. **Validation Errors**: Inline validation feedback
5. **Data Conflicts**: Proper conflict resolution

## Dependencies

- Firebase Firestore v9+
- React Native
- Expo
- TypeScript
- Authentication Service (existing)

## Files Modified/Created

### New Files
- `services/reviewService.ts` - Complete review management service

### Modified Files
- `components/SiteInformationPage.tsx` - Added review UI and functionality
- `services/index.ts` - Added review service export

This implementation provides a robust, user-friendly review and rating system that enhances the heritage site exploration experience while maintaining data integrity and security.
