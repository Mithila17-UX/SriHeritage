import { auth } from './firebase';
import { User } from 'firebase/auth';

// List of admin emails (all lowercase for consistent matching)
const ADMIN_EMAILS = [
  'admin@sriheritage.com',      // Standard email format
  'admin@sriheritage',          // Your original format (normalized to lowercase)
  // 'another.admin@example.com'
];

class AdminAuthService {
  // Check if current user is an admin
  isCurrentUserAdmin(): boolean {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return false;
    }
    
    return this.isAdminEmail(currentUser.email);
  }

  // Check if an email is in the admin list
  isAdminEmail(email: string): boolean {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
    
    console.log('🔐 Admin email check:', {
      inputEmail: email,
      normalizedEmail: normalizedEmail,
      adminEmails: ADMIN_EMAILS,
      isAdmin: isAdmin
    });
    
    return isAdmin;
  }

  // Get current admin user info
  getCurrentAdminUser(): User | null {
    const currentUser = auth.currentUser;
    if (currentUser && this.isAdminEmail(currentUser.email || '')) {
      return currentUser;
    }
    return null;
  }

  // Check admin status with callback for real-time updates
  onAdminStatusChanged(callback: (isAdmin: boolean, user: User | null) => void): () => void {
    return auth.onAuthStateChanged((user) => {
      const isAdmin = user ? this.isAdminEmail(user.email || '') : false;
      callback(isAdmin, user);
    });
  }

  // Validate admin access (throws error if not admin)
  validateAdminAccess(): void {
    if (!this.isCurrentUserAdmin()) {
      throw new Error('Access denied. Admin privileges required.');
    }
  }

  // Get admin display name
  getAdminDisplayName(): string {
    const user = this.getCurrentAdminUser();
    if (!user) return 'Unknown Admin';
    
    return user.displayName || user.email || 'Admin User';
  }

  // Check if user has admin role (for future expansion with custom claims)
  async hasAdminRole(): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      // First check email-based admin
      if (this.isAdminEmail(currentUser.email || '')) {
        return true;
      }

      // Future: Check custom claims
      // const idTokenResult = await currentUser.getIdTokenResult();
      // return !!idTokenResult.claims.admin;
      
      return false;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }

  // Add a new admin email (for future management)
  addAdminEmail(email: string): void {
    const normalizedEmail = email.toLowerCase();
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      ADMIN_EMAILS.push(normalizedEmail);
    }
  }

  // Remove admin email (for future management)
  removeAdminEmail(email: string): void {
    const normalizedEmail = email.toLowerCase();
    const index = ADMIN_EMAILS.indexOf(normalizedEmail);
    if (index > -1) {
      ADMIN_EMAILS.splice(index, 1);
    }
  }

  // Get list of admin emails (for management purposes)
  getAdminEmails(): string[] {
    return [...ADMIN_EMAILS];
  }
}

export const adminAuthService = new AdminAuthService();