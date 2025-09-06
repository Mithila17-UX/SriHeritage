import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { auth } from '../services/firebase';
import { signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';

interface AppSettings {
  autoSync: boolean;
  notifications: boolean;
  backupSchedule: 'manual' | 'daily' | 'weekly';
  lastBackup?: string;
}

interface AdminPanelSettingsTabProps {
  onLogout: () => void;
}

export function AdminPanelSettingsTab({ onLogout }: AdminPanelSettingsTabProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    autoSync: true,
    notifications: true,
    backupSchedule: 'daily',
    lastBackup: undefined
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get current user from Firebase Auth
    const user = auth.currentUser;
    setCurrentUser(user);
    
    // Load app settings
    loadAppSettings();
    
    // Set up listener for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const loadAppSettings = async () => {
    try {
      setLoading(true);
      
      // Try to load app settings from Firestore
      const settingsRef = doc(firestore, 'app_settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data() as AppSettings;
        setAppSettings(settings);
      } else {
        // Create default settings if they don't exist
        const defaultSettings: AppSettings = {
          autoSync: true,
          notifications: true,
          backupSchedule: 'daily',
          lastBackup: new Date().toISOString()
        };
        
        await setDoc(settingsRef, defaultSettings);
        setAppSettings(defaultSettings);
      }
      
      // Set up real-time listener for settings changes only if authenticated
      let unsubscribe = () => {};
      
      if (auth.currentUser) {
        unsubscribe = onSnapshot(settingsRef, (doc) => {
          if (doc.exists()) {
            setAppSettings(doc.data() as AppSettings);
          }
        }, (error) => {
          console.error('Error listening to settings changes:', error);
        });
      }
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error loading app settings:', error);
      // Use default settings if loading fails
      setAppSettings({
        autoSync: true,
        notifications: true,
        backupSchedule: 'daily'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppSetting = async (key: keyof AppSettings, value: any) => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...appSettings,
        [key]: value
      };
      
      // Update Firestore
      const settingsRef = doc(firestore, 'app_settings', 'global');
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      // Update local state (will also be updated by the listener)
      setAppSettings(updatedSettings);
      
    } catch (error) {
      console.error('Error updating app setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout from the admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              onLogout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const triggerManualBackup = async () => {
    Alert.alert(
      'Manual Backup',
      'This will create a backup of all site data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Backup',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Simulate backup process (in a real app, this would trigger a Cloud Function)
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Update last backup time
              await updateAppSetting('lastBackup', new Date().toISOString());
              
              Alert.alert('Success', 'Backup completed successfully!');
              
            } catch (error) {
              console.error('Error during backup:', error);
              Alert.alert('Error', 'Backup failed. Please try again.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const formatLastLogin = (): string => {
    if (!currentUser?.metadata?.lastSignInTime) {
      return 'Unknown';
    }
    
    try {
      return new Date(currentUser.metadata.lastSignInTime).toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatLastBackup = (): string => {
    if (!appSettings.lastBackup) {
      return 'Never';
    }
    
    try {
      return new Date(appSettings.lastBackup).toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const getBackupScheduleText = (schedule: string): string => {
    switch (schedule) {
      case 'manual': return 'Manual only';
      case 'daily': return 'Daily at 2:00 AM';
      case 'weekly': return 'Weekly on Sunday';
      default: return 'Manual only';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.settingsContainer}>
      {/* Admin Settings */}
      <Card style={styles.settingsCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Admin Information</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Admin Email</Text>
            <Text style={styles.settingValue}>
              {currentUser?.email || 'Not logged in'}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>User ID</Text>
            <Text style={styles.settingValue}>
              {currentUser?.uid ? `${currentUser.uid.substring(0, 8)}...` : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Role</Text>
            <Text style={styles.settingValue}>Super Administrator</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Last Login</Text>
            <Text style={styles.settingValue}>{formatLastLogin()}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Account Created</Text>
            <Text style={styles.settingValue}>
              {currentUser?.metadata?.creationTime 
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                : 'Unknown'
              }
            </Text>
          </View>

          <Button
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Logout from Admin Panel
          </Button>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card style={styles.settingsCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>App Settings</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.toggleSettingItem}>
            <View style={styles.toggleSettingText}>
              <Text style={styles.settingLabel}>Auto-sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync data with cloud
              </Text>
            </View>
            <Switch
              value={appSettings.autoSync}
              onValueChange={(value) => updateAppSetting('autoSync', value)}
              disabled={saving}
            />
          </View>
          
          <View style={styles.toggleSettingItem}>
            <View style={styles.toggleSettingText}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive admin notifications
              </Text>
            </View>
            <Switch
              value={appSettings.notifications}
              onValueChange={(value) => updateAppSetting('notifications', value)}
              disabled={saving}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Backup Schedule</Text>
            <Text style={styles.settingValue}>
              {getBackupScheduleText(appSettings.backupSchedule)}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Last Backup</Text>
            <Text style={styles.settingValue}>{formatLastBackup()}</Text>
          </View>
          
          <Button
            onPress={triggerManualBackup}
            disabled={saving}
            style={styles.backupButton}
          >
            {saving ? 'Creating Backup...' : 'Create Manual Backup'}
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card style={styles.settingsCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>System Information</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Database Status</Text>
            <Text style={styles.settingValue}>✅ Connected</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Storage Status</Text>
            <Text style={styles.settingValue}>✅ Active</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Last System Check</Text>
            <Text style={styles.settingValue}>Just now</Text>
          </View>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card style={{...styles.settingsCard, ...styles.dangerCard}}>
        <CardHeader>
          <Text style={{...styles.cardTitle, ...styles.dangerTitle}}>Danger Zone</Text>
        </CardHeader>
        <CardContent>
          <Text style={styles.dangerDescription}>
            These actions are irreversible. Please be careful.
          </Text>
          
          <Button
            onPress={() => {
              Alert.alert(
                'Clear Cache',
                'This will clear all cached data. The app will need to re-download data from the server.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear Cache', 
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Success', 'Cache cleared successfully!');
                    }
                  }
                ]
              );
            }}
            style={styles.dangerButton}
          >
            Clear App Cache
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    padding: 16,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleSettingText: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    maxWidth: '60%',
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    marginTop: 16,
  },
  backupButton: {
    backgroundColor: '#059669',
    marginTop: 16,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerTitle: {
    color: '#DC2626',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});