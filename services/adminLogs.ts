import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, where } from 'firebase/firestore';
import { firestore, auth, ensureAuthenticated } from './firebase';

export interface AdminLogEntry {
  id?: string;
  action: 'add' | 'edit' | 'delete' | 'login' | 'logout' | 'backup' | 'settings_change';
  siteId?: string;
  siteName?: string;
  details?: string;
  timestamp: any;
  adminId: string;
  adminEmail?: string;
}

class AdminLogsService {
  // Ensure authentication before Firestore operations
  private async ensureAuth(): Promise<boolean> {
    return await ensureAuthenticated();
  }
  // Log an admin action
  async logAction(
    action: AdminLogEntry['action'],
    details?: {
      siteId?: string;
      siteName?: string;
      description?: string;
    }
  ): Promise<void> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      const currentUser = auth.currentUser;
      if (!isAuthenticated || !currentUser) {
        console.warn('No authenticated user for logging action');
        return;
      }

      const logEntry: Omit<AdminLogEntry, 'id'> = {
        action,
        timestamp: serverTimestamp(),
        adminId: currentUser.uid,
        adminEmail: currentUser.email || undefined,
        ...(details?.siteId && { siteId: details.siteId }),
        ...(details?.siteName && { siteName: details.siteName }),
        ...(details?.description && { details: details.description })
      };

      await addDoc(collection(firestore, 'admin_logs'), logEntry);
      
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error as logging is not critical for app functionality
    }
  }

  // Log site addition
  async logSiteAdded(siteId: string, siteName: string): Promise<void> {
    await this.logAction('add', {
      siteId,
      siteName,
      description: `Added new heritage site: ${siteName}`
    });
  }

  // Log site edit
  async logSiteEdited(siteId: string, siteName: string): Promise<void> {
    await this.logAction('edit', {
      siteId,
      siteName,
      description: `Edited heritage site: ${siteName}`
    });
  }

  // Log site deletion
  async logSiteDeleted(siteId: string, siteName: string): Promise<void> {
    await this.logAction('delete', {
      siteId,
      siteName,
      description: `Deleted heritage site: ${siteName}`
    });
  }

  // Log admin login
  async logAdminLogin(): Promise<void> {
    await this.logAction('login', {
      description: 'Admin logged into the system'
    });
  }

  // Log admin logout
  async logAdminLogout(): Promise<void> {
    await this.logAction('logout', {
      description: 'Admin logged out of the system'
    });
  }

  // Log backup action
  async logBackupCreated(): Promise<void> {
    await this.logAction('backup', {
      description: 'Manual backup created'
    });
  }

  // Log settings change
  async logSettingsChange(settingName: string, newValue: any): Promise<void> {
    await this.logAction('settings_change', {
      description: `Changed ${settingName} to ${newValue}`
    });
  }

  // Get recent admin logs
  async getRecentLogs(limitCount: number = 20): Promise<AdminLogEntry[]> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      if (!isAuthenticated) {
        console.warn('User not authenticated for fetching admin logs');
        return [];
      }
      
      const logsQuery = query(
        collection(firestore, 'admin_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminLogEntry[];
      
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      return [];
    }
  }

  // Get logs for a specific site
  async getLogsForSite(siteId: string): Promise<AdminLogEntry[]> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      if (!isAuthenticated) {
        console.warn('User not authenticated for fetching site logs');
        return [];
      }
      
      const logsQuery = query(
        collection(firestore, 'admin_logs'),
        where('siteId', '==', siteId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminLogEntry[];
      
    } catch (error) {
      console.error('Error fetching site logs:', error);
      return [];
    }
  }

  // Get logs by action type
  async getLogsByAction(action: AdminLogEntry['action']): Promise<AdminLogEntry[]> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      if (!isAuthenticated) {
        console.warn('User not authenticated for fetching logs by action');
        return [];
      }
      
      const logsQuery = query(
        collection(firestore, 'admin_logs'),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminLogEntry[];
      
    } catch (error) {
      console.error('Error fetching logs by action:', error);
      return [];
    }
  }

  // Get logs for current admin
  async getLogsForCurrentAdmin(): Promise<AdminLogEntry[]> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      const currentUser = auth.currentUser;
      if (!isAuthenticated || !currentUser) {
        console.warn('User not authenticated for fetching admin logs');
        return [];
      }

      const logsQuery = query(
        collection(firestore, 'admin_logs'),
        where('adminId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminLogEntry[];
      
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      return [];
    }
  }

  // Format timestamp for display
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'Unknown time';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      // Handle regular Date
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      // Handle timestamp number
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleString();
      }
      return 'Unknown time';
    } catch (error) {
      return 'Unknown time';
    }
  }

  // Get action display text
  getActionDisplayText(action: AdminLogEntry['action']): string {
    switch (action) {
      case 'add': return 'Added Site';
      case 'edit': return 'Edited Site';
      case 'delete': return 'Deleted Site';
      case 'login': return 'Admin Login';
      case 'logout': return 'Admin Logout';
      case 'backup': return 'Created Backup';
      case 'settings_change': return 'Changed Settings';
      default: return 'Unknown Action';
    }
  }

  // Get action icon
  getActionIcon(action: AdminLogEntry['action']): string {
    switch (action) {
      case 'add': return '➕';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'backup': return '💾';
      case 'settings_change': return '⚙️';
      default: return '📝';
    }
  }

  // Clean up old logs (optional maintenance function)
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      // Ensure authentication before proceeding
      const isAuthenticated = await this.ensureAuth();
      
      if (!isAuthenticated) {
        console.warn('User not authenticated for cleaning up old logs');
        return 0;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldLogsQuery = query(
        collection(firestore, 'admin_logs'),
        where('timestamp', '<', cutoffDate),
        limit(100) // Process in batches
      );

      const querySnapshot = await getDocs(oldLogsQuery);
      
      // In a real implementation, you would delete these documents
      // For now, we just return the count
      return querySnapshot.size;
      
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }
}

export const adminLogsService = new AdminLogsService();