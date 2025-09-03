import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DashboardScreen } from './DashboardScreen';
import { HomeScreen } from './HomeScreen';
import { AllPlacesScreen } from './AllPlacesScreen';
import { ChatScreen } from './ChatScreen';
import { ForumScreen } from './ForumScreen';
import { ProfileScreen } from './ProfileScreen';
import { SiteInformationPage } from './SiteInformationPage';
// Note: You'll need to install react-native-vector-icons or use Expo icons
// For now, we'll use text placeholders
// import { Map, MessageCircle, Users, User, Home, MapPin } from 'lucide-react';

interface MainAppProps {
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

type TabType = 'dashboard' | 'home' | 'places' | 'chat' | 'forum' | 'profile';
type ScreenType = TabType | 'site-info';

interface SiteData {
  id: number;
  name: string;
  location: string;
  district: string;
  distance: string;
  rating: number;
  image: string;
  category: string;
  description: string;
  openingHours?: string;
  entranceFee?: string;
  visiting_hours?: string; // Old field name for compatibility
  entry_fee?: string; // Old field name for compatibility
  gallery: string[] | string; // Allow both array and string formats
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export function MainApp({ user, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [favoriteSites, setFavoriteSites] = useState<number[]>([]);
  const [visitedSites, setVisitedSites] = useState<number[]>([1, 3]); // Mock visited sites
  const [plannedSites, setPlannedSites] = useState<number[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleNavigateToSite = (site: SiteData) => {
    setSelectedSite(site);
    setCurrentScreen('site-info');
  };

  const handleBackFromSite = () => {
    setCurrentScreen(activeTab);
    setSelectedSite(null);
  };

  const toggleFavorite = (siteId: number) => {
    setFavoriteSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleVisitStatusChange = (siteId: number, status: 'visited' | 'not-visited' | 'planned') => {
    if (status === 'visited') {
      setVisitedSites(prev => [...prev, siteId]);
      setPlannedSites(prev => prev.filter(id => id !== siteId));
    } else if (status === 'planned') {
      setPlannedSites(prev => [...prev, siteId]);
      setVisitedSites(prev => prev.filter(id => id !== siteId));
    } else {
      setVisitedSites(prev => prev.filter(id => id !== siteId));
      setPlannedSites(prev => prev.filter(id => id !== siteId));
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            user={user} 
            visitedSites={visitedSites}
            favoriteSites={favoriteSites}
            onNavigateToSite={handleNavigateToSite}
            onNavigateToScreen={handleNavigateToScreen}
          />
        );
      case 'home':
        return (
          <HomeScreen 
            user={user} 
            onNavigateToSite={handleNavigateToSite}
            favoriteSites={favoriteSites}
            visitedSites={visitedSites}
          />
        );
      case 'places':
        return (
          <AllPlacesScreen 
            user={user}
            onNavigateToSite={handleNavigateToSite}
          />
        );
      case 'chat':
        return <ChatScreen />;
      case 'forum':
        return <ForumScreen user={user} />;
      case 'profile':
        return (
          <ProfileScreen 
            user={user} 
            onLogout={onLogout}
            favoriteSites={favoriteSites}
            visitedSites={visitedSites}
            offlineMode={offlineMode}
            onToggleOfflineMode={setOfflineMode}
            onNavigateToSite={handleNavigateToSite}
          />
        );
      case 'site-info':
        return selectedSite ? (
          <SiteInformationPage
            site={selectedSite}
            isFavorite={favoriteSites.includes(selectedSite.id)}
            isVisited={visitedSites.includes(selectedSite.id)}
            isPlanned={plannedSites.includes(selectedSite.id)}
            offlineMode={offlineMode}
            onToggleFavorite={() => toggleFavorite(selectedSite.id)}
            onVisitStatusChange={(status) => handleVisitStatusChange(selectedSite.id, status)}
            onBack={handleBackFromSite}
            onNavigateToSite={handleNavigateToSite}
          />
        ) : null;
      default:
        return (
          <DashboardScreen 
            user={user} 
            visitedSites={visitedSites}
            favoriteSites={favoriteSites}
            onNavigateToSite={handleNavigateToSite}
            onNavigateToScreen={handleNavigateToScreen}
          />
        );
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  // Helper function to handle screen navigation with proper type conversion
  const handleNavigateToScreen = (screen: string) => {
    // Convert string to ScreenType, defaulting to 'dashboard' if invalid
    const validScreens: ScreenType[] = ['dashboard', 'home', 'places', 'chat', 'forum', 'profile', 'site-info'];
    const targetScreen = validScreens.includes(screen as ScreenType) ? (screen as ScreenType) : 'dashboard';
    setCurrentScreen(targetScreen);
    if (targetScreen !== 'site-info') {
      setActiveTab(targetScreen as TabType);
    }
  };

  // Don't show bottom navigation on site info page
  const showBottomNav = currentScreen !== 'site-info';

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <View style={styles.bottomNav}>
          <View style={styles.navContainer}>
            <TouchableOpacity
              onPress={() => handleTabChange('dashboard')}
              style={[
                styles.navButton,
                activeTab === 'dashboard' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'dashboard' ? styles.navIconActive : styles.navIconInactive
              ]}>🏠</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'dashboard' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTabChange('home')}
              style={[
                styles.navButton,
                activeTab === 'home' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'home' ? styles.navIconActive : styles.navIconInactive
              ]}>🗺️</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'home' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTabChange('places')}
              style={[
                styles.navButton,
                activeTab === 'places' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'places' ? styles.navIconActive : styles.navIconInactive
              ]}>📍</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'places' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Places</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTabChange('chat')}
              style={[
                styles.navButton,
                activeTab === 'chat' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'chat' ? styles.navIconActive : styles.navIconInactive
              ]}>💬</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'chat' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTabChange('forum')}
              style={[
                styles.navButton,
                activeTab === 'forum' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'forum' ? styles.navIconActive : styles.navIconInactive
              ]}>👥</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'forum' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Forum</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTabChange('profile')}
              style={[
                styles.navButton,
                activeTab === 'profile' && styles.navButtonActive
              ]}
            >
              <Text style={[
                styles.navIcon,
                activeTab === 'profile' ? styles.navIconActive : styles.navIconInactive
              ]}>👤</Text>
              <Text style={[
                styles.navLabel,
                activeTab === 'profile' ? styles.navLabelActive : styles.navLabelInactive
              ]}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
  },
  navButtonActive: {
    backgroundColor: '#FFF7ED', // orange-50
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    color: '#EA580C', // orange-600
  },
  navIconInactive: {
    color: '#4B5563', // gray-600
  },
  navLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  navLabelInactive: {
    color: '#4B5563', // gray-600
  },
});