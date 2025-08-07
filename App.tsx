import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text } from 'react-native';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MainApp } from './components/MainApp';
import { AdminPanelUpdated } from './components/AdminPanelUpdated';
import { appServices, authService, adminAuthService, adminLogsService } from './services';
import { User } from 'firebase/auth';

type ScreenType = 'onboarding' | 'login' | 'signup' | 'forgot-password' | 'main' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [user, setUser] = useState<User | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize app services
        await appServices.initialize();
        
        // Check onboarding status
        const onboardingCompleted = await AsyncStorage.getItem('sri-heritage-onboarding-completed');
        setHasSeenOnboarding(!!onboardingCompleted);
        
        // Set up auth state listener
        const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
          console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
          setUser(firebaseUser);
          
          if (firebaseUser) {
            // Check if this is an admin user using the admin auth service
            const isUserAdmin = adminAuthService.isAdminEmail(firebaseUser.email || '');
            
            console.log('👤 User login check:', {
              email: firebaseUser.email,
              isAdmin: isUserAdmin,
              willNavigateTo: isUserAdmin ? 'admin' : (onboardingCompleted ? 'main' : 'onboarding')
            });
            
            if (isUserAdmin) {
              console.log('✅ Navigating to admin panel');
              setIsAdmin(true);
              setCurrentScreen('admin');
              
              // Log admin login (async but don't block UI)
              adminLogsService.logAdminLogin().catch((error) => {
                console.error('Failed to log admin login:', error);
              });
            } else {
              console.log('❌ Not admin, navigating to main app');
              setIsAdmin(false);
              if (onboardingCompleted) {
                setCurrentScreen('main');
              } else {
                setCurrentScreen('onboarding');
              }
            }
          } else {
            setIsAdmin(false);
            if (onboardingCompleted) {
              setCurrentScreen('login');
            } else {
              setCurrentScreen('onboarding');
            }
          }
        });
        
        setIsInitializing(false);
        
        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
        setIsInitializing(false);
      }
    };
    
    const cleanup = initializeApp();
    
    // Cleanup function
    return () => {
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      await authService.signIn({ email, password });
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Let the component handle the error display
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    try {
      await authService.signUp({ email, password, displayName: name });
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Signup failed:', error);
      throw error; // Let the component handle the error display
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('sri-heritage-onboarding-completed', 'true');
      setHasSeenOnboarding(true);
      setCurrentScreen(user ? 'main' : 'login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleNavigateToSignup = () => {
    setCurrentScreen('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

  const handleNavigateToForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleLoginWithForgotPassword = async (email: string, password: string) => {
    await handleLogin(email, password);
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const renderContent = () => {
    // Show loading screen while initializing
    if (isInitializing) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Initializing Sri Heritage App...
          </Text>
        </View>
      );
    }

    // Show error screen if initialization failed
    if (initError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#DC2626', textAlign: 'center', marginBottom: 16 }}>
            Failed to Initialize App
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {initError}
          </Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLoginWithForgotPassword}
            onNavigateToSignup={handleNavigateToSignup}
            onNavigateToForgotPassword={handleNavigateToForgotPassword}
          />
        );
      case 'signup':
        return (
          <SignupScreen
            onSignup={handleSignup}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBackToLogin={handleNavigateToLogin}
            onForgotPassword={handleForgotPassword}
          />
        );
      case 'main':
        return <MainApp user={user ? { 
          name: user.displayName || user.email?.split('@')[0] || 'User', 
          email: user.email || '' 
        } : null} onLogout={handleLogout} />;
      case 'admin':
        return <AdminPanelUpdated onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {renderContent()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
