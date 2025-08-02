import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MainApp } from './components/MainApp';
import { AdminPanel } from './components/AdminPanel';

type ScreenType = 'onboarding' | 'login' | 'signup' | 'forgot-password' | 'main' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('sri-heritage-onboarding-completed');
        setHasSeenOnboarding(!!onboardingCompleted);
        
        if (!onboardingCompleted) {
          setCurrentScreen('onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    
    checkOnboarding();
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Check if this is an admin login
    if (email === 'Admin@SriHeritage' && password === 'SriHeritageAd7788') {
      setUser({ name: 'Administrator', email });
      setIsAdmin(true);
      setCurrentScreen('admin');
    } else {
      setUser({ name: email.split('@')[0], email });
      setIsAdmin(false);
      setCurrentScreen('main');
    }
  };

  const handleSignup = (name: string, email: string, password: string) => {
    setUser({ name, email });
    
    if (!hasSeenOnboarding) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('main');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setCurrentScreen('login');
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

  const handleLoginWithForgotPassword = (email: string, password: string) => {
    handleLogin(email, password);
  };

  const renderContent = () => {
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
          />
        );
      case 'main':
        return <MainApp user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminPanel onLogout={handleLogout} />;
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
