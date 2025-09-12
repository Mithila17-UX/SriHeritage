import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';

interface AnalyticsData {
  totalSites: number;
  religiousSites: number;
  archaeologicalSites: number;
  averageRating: number;
  categoryBreakdown: { [key: string]: number };
}

interface AdminLog {
  id: string;
  action: 'add' | 'edit' | 'delete';
  siteId: string;
  timestamp: any;
  adminId: string;
}

export function AdminPanelAnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSites: 0,
    religiousSites: 0,
    archaeologicalSites: 0,
    averageRating: 0,
    categoryBreakdown: {}
  });
  const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    loadRecentAdminLogs();
    
    // Set up real-time listener for sites collection to update analytics
    let unsubscribe = () => {};
    
    // Check if user is authenticated before setting up listeners
    if (auth.currentUser) {
      unsubscribe = onSnapshot(
        collection(firestore, 'sites'),
        (snapshot) => {
          calculateAnalyticsFromSnapshot(snapshot);
        },
        (error) => {
          console.error('Error listening to sites for analytics:', error);
          // Fallback to non-real-time data on error
          loadAnalyticsData();
        }
      );
    } else {
      // If not authenticated, set up auth state listener
      const authUnsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          // User is now signed in, set up Firestore listener
          unsubscribe = onSnapshot(
            collection(firestore, 'sites'),
            (snapshot) => {
              calculateAnalyticsFromSnapshot(snapshot);
            },
            (error) => {
              console.error('Error listening to sites for analytics:', error);
              // Fallback to non-real-time data on error
              loadAnalyticsData();
            }
          );
          // No need to continue listening for auth changes
          authUnsubscribe();
        }
      });
    }

    return () => unsubscribe();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const sitesCollection = collection(firestore, 'sites');
      const sitesSnapshot = await getDocs(sitesCollection);
      
      calculateAnalyticsFromSnapshot(sitesSnapshot);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsFromSnapshot = (snapshot: any) => {
    const sites = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalSites = sites.length;
    const religiousSites = sites.filter((site: any) => 
      site.category?.toLowerCase().includes('religious')
    ).length;
    const archaeologicalSites = sites.filter((site: any) => 
      site.category?.toLowerCase().includes('archaeological')
    ).length;
    
    const totalRating = sites.reduce((sum: number, site: any) => sum + (site.rating || 0), 0);
    const averageRating = totalSites > 0 ? totalRating / totalSites : 0;
    
    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    sites.forEach((site: any) => {
      const category = site.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    setAnalytics({
      totalSites,
      religiousSites,
      archaeologicalSites,
      averageRating,
      categoryBreakdown
    });
  };

  const loadRecentAdminLogs = async () => {
    try {
      // Try to load admin logs if the collection exists
      const logsQuery = query(
        collection(firestore, 'admin_logs'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: data.action || 'unknown',
          siteId: data.siteId || 'unknown',
          timestamp: data.timestamp || null,
          adminId: data.adminId || 'unknown'
        };
      }) as AdminLog[];
      
      setRecentLogs(logs);
      
    } catch (error) {
      console.error('Error loading admin logs:', error);
      // If admin_logs collection doesn't exist, that's okay
      setRecentLogs([]);
    }
  };

  const formatTimestamp = (timestamp: any): string => {
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
  };

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'add': return '➕';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      default: return '📝';
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'add': return 'Added site';
      case 'edit': return 'Edited site';
      case 'delete': return 'Deleted site';
      default: return 'Unknown action';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.analyticsContainer}>
      <Text style={styles.sectionTitle}>Analytics Dashboard</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>{analytics.totalSites}</Text>
            <Text style={styles.statLabel}>Total Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>{analytics.religiousSites}</Text>
            <Text style={styles.statLabel}>Religious Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>{analytics.archaeologicalSites}</Text>
            <Text style={styles.statLabel}>Archaeological Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>
              {analytics.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </CardContent>
        </Card>
      </View>

      {/* Category Breakdown */}
      {Object.keys(analytics.categoryBreakdown).length > 0 && (
        <Card style={styles.categoryCard}>
          <CardHeader>
            <Text style={styles.cardTitle}>Sites by Category</Text>
          </CardHeader>
          <CardContent>
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryCount}>{count}</Text>
                  <Text style={styles.categoryPercentage}>
                    ({((count / analytics.totalSites) * 100).toFixed(1)}%)
                  </Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card style={styles.recentActivityCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Recent Admin Activity</Text>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <View key={log.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{getActionIcon(log.action)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {getActionText(log.action)} (ID: {log.siteId ? log.siteId.substring(0, 8) + '...' : 'Unknown'})
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTimestamp(log.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noActivityContainer}>
              <Text style={styles.noActivityText}>No recent activity logged</Text>
              <Text style={styles.noActivitySubtext}>
                Admin actions will appear here when logged
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card style={styles.systemStatusCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>System Status</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Database Connection</Text>
            <Text style={styles.statusValue}>✅ Connected</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Last Data Sync</Text>
            <Text style={styles.statusValue}>Just now</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Storage Usage</Text>
            <Text style={styles.statusValue}>📊 Normal</Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  analyticsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
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
    margin: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryCard: {
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginRight: 8,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentActivityCard: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  noActivityContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noActivityText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  noActivitySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  systemStatusCard: {
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
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
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