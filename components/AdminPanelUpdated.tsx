import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AdminPanelSitesTab } from './AdminPanelSitesTab';
import { AdminPanelAddSiteTab } from './AdminPanelAddSiteTab';
import { AdminPanelGalleryModal } from './AdminPanelGalleryModal';
import { AdminPanelEditSiteModal } from './AdminPanelEditSiteModal';
import { AdminPanelAnalyticsTab } from './AdminPanelAnalyticsTab';
import { AdminPanelSettingsTab } from './AdminPanelSettingsTab';
import { AdminAccessGuard } from './AdminAccessGuard';

interface AdminPanelProps {
  onLogout: () => void;
}

interface Site {
  id: string;
  name: string;
  location: string;
  district: string;
  distance: string;
  rating: number;
  image: string;
  category: string;
  description: string;
  openingHours: string;
  entranceFee: string;
  gallery: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

type TabType = 'sites' | 'add-site' | 'analytics' | 'settings';

export function AdminPanelUpdated({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleAccessDenied = () => {
    // When access is denied, logout and return to main app
    onLogout();
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setIsEditModalVisible(true);
    console.log('🖊️ Opening edit modal for site:', site.name);
  };

  const handleManageGallery = (site: Site) => {
    setSelectedSite(site);
    setIsGalleryModalVisible(true);
  };

  const handleSiteAdded = () => {
    // Refresh sites tab after adding a site
    setActiveTab('sites');
  };

  const handleGalleryUpdated = (updatedSite: Site) => {
    // Update the selected site with new gallery data
    setSelectedSite(updatedSite);
  };

  const handleSiteUpdated = (updatedSite: Site) => {
    // Update the selected site with new data
    setSelectedSite(updatedSite);
    console.log('✅ Site updated:', updatedSite.name);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sites':
        return (
          <AdminPanelSitesTab
            onEditSite={handleEditSite}
            onManageGallery={handleManageGallery}
          />
        );
      case 'add-site':
        return <AdminPanelAddSiteTab onSiteAdded={handleSiteAdded} />;
      case 'analytics':
        return <AdminPanelAnalyticsTab />;
      case 'settings':
        return <AdminPanelSettingsTab onLogout={onLogout} />;
      default:
        return (
          <AdminPanelSitesTab
            onEditSite={handleEditSite}
            onManageGallery={handleManageGallery}
          />
        );
    }
  };

  return (
    <AdminAccessGuard onAccessDenied={handleAccessDenied}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sri Heritage Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage Heritage Sites & Content</Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('sites')}
            style={[styles.tab, activeTab === 'sites' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'sites' && styles.activeTabText]}>
              📍 Sites
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('add-site')}
            style={[styles.tab, activeTab === 'add-site' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'add-site' && styles.activeTabText]}>
              ➕ Add Site
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              📊 Analytics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              ⚙️ Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Gallery Modal */}
        <AdminPanelGalleryModal
          visible={isGalleryModalVisible}
          site={selectedSite}
          onClose={() => {
            setIsGalleryModalVisible(false);
            setSelectedSite(null);
          }}
          onGalleryUpdated={handleGalleryUpdated}
        />

        {/* Edit Site Modal */}
        <AdminPanelEditSiteModal
          visible={isEditModalVisible}
          site={selectedSite}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedSite(null);
          }}
          onSiteUpdated={handleSiteUpdated}
        />
      </View>
    </AdminAccessGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1E40AF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});