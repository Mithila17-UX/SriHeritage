import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { adminAuthService } from '../services/adminAuth';
import { User } from 'firebase/auth';

interface AdminAccessGuardProps {
  children: React.ReactNode;
  onAccessDenied?: () => void;
}

export function AdminAccessGuard({ children, onAccessDenied }: AdminAccessGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial admin status
    const currentUser = adminAuthService.getCurrentAdminUser();
    setIsAdmin(!!currentUser);
    setUser(currentUser);
    setLoading(false);

    // Set up listener for auth changes
    const unsubscribe = adminAuthService.onAdminStatusChanged((adminStatus, authUser) => {
      setIsAdmin(adminStatus);
      setUser(authUser);
      setLoading(false);

      // If user loses admin access, call the callback
      if (!adminStatus && onAccessDenied) {
        onAccessDenied();
      }
    });

    return unsubscribe;
  }, [onAccessDenied]);

  const handleGoBack = () => {
    if (onAccessDenied) {
      onAccessDenied();
    }
  };

  const handleRequestAccess = () => {
    Alert.alert(
      'Admin Access Required',
      'To request admin access, please contact the system administrator with your account details.',
      [
        { text: 'OK' },
        { 
          text: 'Go Back', 
          onPress: handleGoBack 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking admin access...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Card style={styles.accessCard}>
          <CardHeader>
            <Text style={styles.accessTitle}>Authentication Required</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.accessContent}>
              <Text style={styles.accessIcon}>🔐</Text>
              <Text style={styles.accessMessage}>
                Please log in to access the admin panel
              </Text>
              <Button onPress={handleGoBack} style={styles.backButton}>
                Go to Login
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Card style={styles.accessCard}>
          <CardHeader>
            <Text style={styles.accessTitle}>Access Denied</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.accessContent}>
              <Text style={styles.accessIcon}>⛔</Text>
              <Text style={styles.accessMessage}>
                Admin privileges required to access this panel
              </Text>
              <Text style={styles.userInfo}>
                Signed in as: {user.email}
              </Text>
              <Text style={styles.contactInfo}>
                Contact system administrator for access
              </Text>
              
              <View style={styles.buttonContainer}>
                <Button 
                  onPress={handleRequestAccess} 
                  style={styles.requestButton}
                >
                  Request Access
                </Button>
                <Button 
                  onPress={handleGoBack} 
                  style={styles.backButton}
                >
                  Go Back
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    );
  }

  // User is authenticated and is an admin - render the admin panel
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  accessCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  accessContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  accessIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  accessMessage: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  userInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  requestButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  backButton: {
    backgroundColor: '#6B7280',
    width: '100%',
  },
});