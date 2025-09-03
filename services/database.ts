import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database interfaces
export interface Site {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  image_url?: string;
  historical_period?: string;
  significance?: string;
  visiting_hours?: string;
  entry_fee?: string;
  created_at: string;
  updated_at: string;
  // Additional fields for admin panel compatibility
  district?: string;
  distance?: string;
  rating?: number;
  image?: string;
  openingHours?: string;
  entranceFee?: string;
  gallery?: string; // JSON string of image URLs
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // BEGIN nearby - Optional fields for nearby functionality
  subplaces?: SiteSubplace[];
  nearby?: NearbySite[];
  // END nearby
}

// BEGIN nearby - New types for nearby functionality
export type DistanceKm = number;

export type SiteSubplace = Omit<Site, 'subplaces' | 'nearby'> & {
  distanceKm?: DistanceKm; // optional for subplaces
};

export type NearbySite = Omit<Site, 'subplaces' | 'nearby'> & {
  distanceKm?: DistanceKm; // used for nearby attractions
};
// END nearby

export interface FavoriteSite {
  id: number;
  user_id: string;
  site_id: number;
  created_at: string;
}

export interface VisitedSite {
  id: number;
  user_id: string;
  site_id: number;
  visited_at: string;
  notes?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing database...');
      
      // Close any existing connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.warn('Error closing existing database:', closeError);
        }
        this.db = null;
      }
      
      // Open database
      this.db = await SQLite.openDatabaseAsync('sriheritage.db');
      console.log('✅ Database connection opened');
      
      // Test the connection with a simple query
      try {
        await this.db.getFirstAsync('SELECT 1 as test');
        console.log('✅ Database connection test passed');
      } catch (testError) {
        console.error('❌ Database connection test failed, attempting recovery...');
        await this.resetDatabase();
        return;
      }
      
      // Create tables
      await this.createTables();
      console.log('✅ Tables created/verified');
      
      // Check if we need to seed data (only if no sites exist)
      try {
        const existingSites = await this.getAllSites();
        console.log('📊 Existing sites found:', existingSites.length);
        
        if (existingSites.length === 0) {
          const hasSeededData = await AsyncStorage.getItem('database_seeded');
          if (!hasSeededData) {
            console.log('🌱 Seeding database with initial data...');
            await this.seedSitesData();
            await AsyncStorage.setItem('database_seeded', 'true');
            console.log('✅ Database seeded successfully');
          }
        }
      } catch (seedError) {
        console.error('❌ Error during seeding, attempting recovery:', seedError);
        await this.resetDatabase();
        return;
      }
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      console.log('🔄 Attempting database reset...');
      await this.resetDatabase();
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      
      // Close existing connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.warn('Error closing database during reset:', closeError);
        }
        this.db = null;
      }
      
      // Delete the database file by opening with a new name and recreating
      this.db = await SQLite.openDatabaseAsync('sriheritage_new.db');
      console.log('✅ New database created');
      
      // Create tables
      await this.createTables();
      console.log('✅ Tables recreated');
      
      // Seed with initial data
      await this.seedSitesData();
      await AsyncStorage.setItem('database_seeded', 'true');
      console.log('✅ Database reset and seeded successfully');
      
      this.isInitialized = true;
    } catch (resetError) {
      console.error('❌ Failed to reset database:', resetError);
      throw resetError;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Sites table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          location TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          historical_period TEXT,
          significance TEXT,
          visiting_hours TEXT,
          entry_fee TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Favorite sites table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorite_sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          site_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (site_id) REFERENCES sites (id),
          UNIQUE(user_id, site_id)
        );
      `);

      // Visited sites table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS visited_sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          site_id INTEGER NOT NULL,
          visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (site_id) REFERENCES sites (id),
          UNIQUE(user_id, site_id)
        );
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  private async seedSitesData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sampleSites = [
      {
        name: 'Temple of the Sacred Tooth Relic',
        description: 'A Buddhist temple located in Kandy, Sri Lanka, housing the sacred tooth relic of Buddha.',
        location: 'Kandy',
        latitude: 7.2906,
        longitude: 80.6337,
        category: 'Religious Site',
        image_url: 'https://example.com/tooth-relic-temple.jpg',
        historical_period: '1687-1707',
        significance: 'One of the most sacred Buddhist temples in the world',
        visiting_hours: '5:30 AM - 8:00 PM',
        entry_fee: 'LKR 1000 for foreigners'
      },
      {
        name: 'Sigiriya Rock Fortress',
        description: 'An ancient rock fortress and palace ruins surrounded by extensive gardens.',
        location: 'Matale District',
        latitude: 7.9570,
        longitude: 80.7603,
        category: 'Archaeological Site',
        image_url: 'https://example.com/sigiriya.jpg',
        historical_period: '477-495 CE',
        significance: 'UNESCO World Heritage Site, ancient capital of Sri Lanka',
        visiting_hours: '7:00 AM - 5:30 PM',
        entry_fee: 'USD 30 for foreigners'
      },
      {
        name: 'Galle Fort',
        description: 'A fortified city built by Portuguese and later modified by Dutch colonizers.',
        location: 'Galle',
        latitude: 6.0329,
        longitude: 80.2168,
        category: 'Colonial Heritage',
        image_url: 'https://example.com/galle-fort.jpg',
        historical_period: '1588-1796',
        significance: 'UNESCO World Heritage Site, best preserved colonial fortification in Asia',
        visiting_hours: '24 hours (some areas restricted)',
        entry_fee: 'Free (some museums charge separately)'
      },
      {
        name: 'Anuradhapura Ancient City',
        description: 'Sacred city of Anuradhapura and the surrounding area.',
        location: 'Anuradhapura',
        latitude: 8.3114,
        longitude: 80.4037,
        category: 'Archaeological Site',
        image_url: 'https://example.com/anuradhapura.jpg',
        historical_period: '377 BCE - 1017 CE',
        significance: 'UNESCO World Heritage Site, first capital of Sri Lanka',
        visiting_hours: '6:00 AM - 6:00 PM',
        entry_fee: 'USD 25 for foreigners'
      },
      {
        name: 'Polonnaruwa Ancient City',
        description: 'Medieval capital of Sri Lanka with well-preserved ruins.',
        location: 'Polonnaruwa',
        latitude: 7.9403,
        longitude: 81.0188,
        category: 'Archaeological Site',
        image_url: 'https://example.com/polonnaruwa.jpg',
        historical_period: '1055-1212 CE',
        significance: 'UNESCO World Heritage Site, second ancient capital',
        visiting_hours: '7:00 AM - 6:00 PM',
        entry_fee: 'USD 25 for foreigners'
      }
    ];

    try {
      for (const site of sampleSites) {
        await this.db.runAsync(
          `INSERT INTO sites (name, description, location, latitude, longitude, category, image_url, historical_period, significance, visiting_hours, entry_fee)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            site.name,
            site.description,
            site.location,
            site.latitude,
            site.longitude,
            site.category,
            site.image_url,
            site.historical_period,
            site.significance,
            site.visiting_hours,
            site.entry_fee
          ]
        );
      }
      console.log('Sample sites data seeded successfully');
    } catch (error) {
      console.error('Failed to seed sites data:', error);
      throw error;
    }
  }

  // Sites operations
  async getAllSites(): Promise<Site[]> {
    if (!this.db) {
      console.error('Database not initialized in getAllSites');
      return [];
    }
    
    try {
      const result = await this.db.getAllAsync('SELECT * FROM sites ORDER BY name ASC');
      return result as Site[];
    } catch (error) {
      console.error('Failed to get all sites:', error);
      console.log('🔄 Attempting to reinitialize database...');
      
      // Try to reinitialize the database
      this.isInitialized = false;
      try {
        await this.initializeDatabase();
        const retryResult = await this.db!.getAllAsync('SELECT * FROM sites ORDER BY name ASC');
        return retryResult as Site[];
      } catch (retryError) {
        console.error('Failed to get sites after reinitialize:', retryError);
        return [];
      }
    }
  }

  async getSiteById(id: number): Promise<Site | null> {
    if (!this.db) {
      console.error('Database not initialized in getSiteById');
      return null;
    }
    
    try {
      const result = await this.db.getFirstAsync('SELECT * FROM sites WHERE id = ?', [id]);
      return result as Site | null;
    } catch (error) {
      console.error('Failed to get site by id:', error);
      console.log('🔄 Attempting to reinitialize database for getSiteById...');
      
      // Try to reinitialize the database
      this.isInitialized = false;
      try {
        await this.initializeDatabase();
        const retryResult = await this.db!.getFirstAsync('SELECT * FROM sites WHERE id = ?', [id]);
        return retryResult as Site | null;
      } catch (retryError) {
        console.error('Failed to get site by id after reinitialize:', retryError);
        return null;
      }
    }
  }

  async searchSites(query: string): Promise<Site[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const searchQuery = `%${query}%`;
      const result = await this.db.getAllAsync(
        'SELECT * FROM sites WHERE name LIKE ? OR description LIKE ? OR location LIKE ? ORDER BY name ASC',
        [searchQuery, searchQuery, searchQuery]
      );
      return result as Site[];
    } catch (error) {
      console.error('Failed to search sites:', error);
      throw error;
    }
  }

  async getSitesByCategory(category: string): Promise<Site[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sites WHERE category = ? ORDER BY name ASC',
        [category]
      );
      return result as Site[];
    } catch (error) {
      console.error('Failed to get sites by category:', error);
      throw error;
    }
  }

  // Favorite sites operations
  async addFavoriteSite(userId: string, siteId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO favorite_sites (user_id, site_id) VALUES (?, ?)',
        [userId, siteId]
      );
    } catch (error) {
      console.error('Failed to add favorite site:', error);
      throw error;
    }
  }

  async removeFavoriteSite(userId: string, siteId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'DELETE FROM favorite_sites WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
    } catch (error) {
      console.error('Failed to remove favorite site:', error);
      throw error;
    }
  }

  async getFavoriteSites(userId: string): Promise<Site[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(`
        SELECT s.* FROM sites s
        INNER JOIN favorite_sites fs ON s.id = fs.site_id
        WHERE fs.user_id = ?
        ORDER BY fs.created_at DESC
      `, [userId]);
      return result as Site[];
    } catch (error) {
      console.error('Failed to get favorite sites:', error);
      throw error;
    }
  }

  async isSiteFavorited(userId: string, siteId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getFirstAsync(
        'SELECT 1 FROM favorite_sites WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
      return result !== null;
    } catch (error) {
      console.error('Failed to check if site is favorited:', error);
      throw error;
    }
  }

  // Visited sites operations
  async addVisitedSite(userId: string, siteId: number, notes?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO visited_sites (user_id, site_id, notes) VALUES (?, ?, ?)',
        [userId, siteId, notes || null]
      );
    } catch (error) {
      console.error('Failed to add visited site:', error);
      throw error;
    }
  }

  async removeVisitedSite(userId: string, siteId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'DELETE FROM visited_sites WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
    } catch (error) {
      console.error('Failed to remove visited site:', error);
      throw error;
    }
  }

  async getVisitedSites(userId: string): Promise<(Site & { visited_at: string; notes?: string })[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(`
        SELECT s.*, vs.visited_at, vs.notes FROM sites s
        INNER JOIN visited_sites vs ON s.id = vs.site_id
        WHERE vs.user_id = ?
        ORDER BY vs.visited_at DESC
      `, [userId]);
      return result as (Site & { visited_at: string; notes?: string })[];
    } catch (error) {
      console.error('Failed to get visited sites:', error);
      throw error;
    }
  }

  async isSiteVisited(userId: string, siteId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getFirstAsync(
        'SELECT 1 FROM visited_sites WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
      return result !== null;
    } catch (error) {
      console.error('Failed to check if site is visited:', error);
      throw error;
    }
  }

  // Get user's favorite site IDs for syncing
  async getUserFavoriteSiteIds(userId: string): Promise<number[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(
        'SELECT site_id FROM favorite_sites WHERE user_id = ?',
        [userId]
      );
      return result.map((row: any) => row.site_id);
    } catch (error) {
      console.error('Failed to get user favorite site IDs:', error);
      throw error;
    }
  }

  // Get user's visited site IDs for syncing
  async getUserVisitedSiteIds(userId: string): Promise<{ site_id: number; visited_at: string; notes?: string }[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(
        'SELECT site_id, visited_at, notes FROM visited_sites WHERE user_id = ?',
        [userId]
      );
      return result as { site_id: number; visited_at: string; notes?: string }[];
    } catch (error) {
      console.error('Failed to get user visited site IDs:', error);
      throw error;
    }
  }

  // Bulk operations for syncing
  async bulkAddFavorites(userId: string, siteIds: number[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.withTransactionAsync(async () => {
        for (const siteId of siteIds) {
          await this.db!.runAsync(
            'INSERT OR IGNORE INTO favorite_sites (user_id, site_id) VALUES (?, ?)',
            [userId, siteId]
          );
        }
      });
    } catch (error) {
      console.error('Failed to bulk add favorites:', error);
      throw error;
    }
  }

  async bulkAddVisited(userId: string, visitedSites: { site_id: number; visited_at: string; notes?: string }[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.withTransactionAsync(async () => {
        for (const visited of visitedSites) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO visited_sites (user_id, site_id, visited_at, notes) VALUES (?, ?, ?, ?)',
            [userId, visited.site_id, visited.visited_at, visited.notes || null]
          );
        }
      });
    } catch (error) {
      console.error('Failed to bulk add visited sites:', error);
      throw error;
    }
  }

  // Remove all duplicates and keep only unique sites by name
  async removeDuplicateSites(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(`
        DELETE FROM sites 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM sites 
          GROUP BY name, location
        )
      `);
      console.log('✅ Removed duplicate sites');
    } catch (error) {
      console.error('Failed to remove duplicate sites:', error);
      throw error;
    }
  }

  // Admin panel specific methods
  async insertOrUpdateSite(site: Partial<Site> & { id: number }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Check if site exists by ID first (this is the primary key from Firestore)
      const existingSite = await this.getSiteById(site.id);
      
      if (existingSite) {
        // Update existing site by ID
        await this.db.runAsync(
          `UPDATE sites SET 
            name = ?,
            description = ?,
            location = ?,
            latitude = ?,
            longitude = ?,
            category = ?,
            image_url = ?,
            historical_period = ?,
            significance = ?,
            visiting_hours = ?,
            entry_fee = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
          [
            site.name || '',
            site.description || '',
            site.location || '',
            site.coordinates?.latitude || site.latitude || 0,
            site.coordinates?.longitude || site.longitude || 0,
            site.category || '',
            site.image || site.image_url || '',
            site.historical_period || '',
            site.significance || '',
            site.openingHours || site.visiting_hours || '',
            site.entranceFee || site.entry_fee || '',
            site.id
          ]
        );
        console.log('✅ Updated site by ID:', site.id, site.name);
      } else {
        // Insert new site with the Firestore-generated ID
        await this.db.runAsync(
          `INSERT INTO sites (
            id, name, description, location, latitude, longitude, category,
            image_url, historical_period, significance, visiting_hours, entry_fee,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            site.id,
            site.name || '',
            site.description || '',
            site.location || '',
            site.coordinates?.latitude || site.latitude || 0,
            site.coordinates?.longitude || site.longitude || 0,
            site.category || '',
            site.image || site.image_url || '',
            site.historical_period || '',
            site.significance || '',
            site.openingHours || site.visiting_hours || '',
            site.entranceFee || site.entry_fee || ''
          ]
        );
        console.log('✅ Inserted new site from Firestore:', site.id, site.name);
      }
    } catch (error) {
      console.error('Failed to insert or update site:', error);
      throw error;
    }
  }

  async deleteSite(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Delete site and related records
      await this.db.withTransactionAsync(async () => {
        // Delete from favorite_sites
        await this.db!.runAsync('DELETE FROM favorite_sites WHERE site_id = ?', [id]);
        
        // Delete from visited_sites
        await this.db!.runAsync('DELETE FROM visited_sites WHERE site_id = ?', [id]);
        
        // Delete the site itself
        await this.db!.runAsync('DELETE FROM sites WHERE id = ?', [id]);
      });
    } catch (error) {
      console.error('Failed to delete site:', error);
      throw error;
    }
  }

  // Helper method to convert database site to admin panel format
  convertToAdminSite(dbSite: Site): any {
    return {
      id: dbSite.id.toString(),
      name: dbSite.name,
      location: dbSite.location,
      district: dbSite.district || '',
      distance: dbSite.distance || '',
      rating: dbSite.rating || 0,
      image: dbSite.image || dbSite.image_url || '',
      category: dbSite.category,
      description: dbSite.description,
      openingHours: dbSite.openingHours || dbSite.visiting_hours || '',
      entranceFee: dbSite.entranceFee || dbSite.entry_fee || '',
      gallery: dbSite.gallery ? JSON.parse(dbSite.gallery) : [],
      coordinates: {
        latitude: dbSite.latitude,
        longitude: dbSite.longitude
      }
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();