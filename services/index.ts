// Export all services
export { databaseService } from './database';
export { authService } from './auth';
export { syncService } from './sync';
export { storageService } from './storage';
export { adminLogsService } from './adminLogs';
export { adminAuthService } from './adminAuth';

// Export types
export type { Site, FavoriteSite, VisitedSite } from './database';
export type { UserProfile, SignupData, LoginData } from './auth';
export type { ForumPost, ForumComment } from './sync';
export type { ImageUploadResult } from './storage';
export type { AdminLogEntry } from './adminLogs';

// Initialize database on app start
import { databaseService } from './database';
import { syncService } from './sync';
import { authService } from './auth';

class AppServices {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing app services...');
      
      // Initialize database first
      await databaseService.initializeDatabase();
      
      // Set up auth state listener for sync
      authService.onAuthStateChanged(async (user) => {
        if (user) {
          // User logged in - perform sync
          try {
            await syncService.schedulePeriodicSync();
          } catch (error) {
            console.error('Failed to sync on login:', error);
          }
        }
      });

      this.initialized = true;
      console.log('App services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app services:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const appServices = new AppServices();