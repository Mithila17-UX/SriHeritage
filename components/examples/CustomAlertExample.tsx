import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useCustomAlert } from '../ui/custom-alert';

/**
 * Example component demonstrating the custom alert system
 * This showcases different alert types and usage patterns
 */
export function CustomAlertExample() {
  const { showError, showWarning, showSuccess, showInfo, AlertComponent } = useCustomAlert();

  const handleShowError = () => {
    showError(
      'Authentication Failed',
      'Invalid email or password. Please check your credentials and try again.'
    );
  };

  const handleShowWarning = () => {
    showWarning(
      'Login Required',
      'Please log in to access your favorites and track your heritage journey.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', style: 'default', onPress: () => console.log('Navigate to login') }
      ]
    );
  };

  const handleShowSuccess = () => {
    showSuccess(
      'Account Created Successfully',
      'Welcome to Sri Heritage! Your account has been created.'
    );
  };

  const handleShowInfo = () => {
    showInfo(
      'Location Services',
      'Enable location services to get directions to heritage sites and discover nearby attractions.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Enable', style: 'default', onPress: () => console.log('Enable location') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <CardHeader>
          <Text style={styles.title}>Custom Alert Examples</Text>
          <Text style={styles.subtitle}>
            Tap the buttons below to see different alert types in action
          </Text>
        </CardHeader>
        
        <CardContent style={styles.content}>
          <View style={styles.buttonGroup}>
            <Button onPress={handleShowError} style={styles.errorButton}>
              <Text style={styles.buttonText}>Show Error Alert</Text>
            </Button>
            
            <Button onPress={handleShowWarning} style={styles.warningButton}>
              <Text style={styles.buttonText}>Show Warning Alert</Text>
            </Button>
            
            <Button onPress={handleShowSuccess} style={styles.successButton}>
              <Text style={styles.buttonText}>Show Success Alert</Text>
            </Button>
            
            <Button onPress={handleShowInfo} style={styles.infoButton}>
              <Text style={styles.buttonText}>Show Info Alert</Text>
            </Button>
          </View>
          
          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>Features:</Text>
            <Text style={styles.featureItem}>• Beautiful animations and transitions</Text>
            <Text style={styles.featureItem}>• Haptic feedback for different alert types</Text>
            <Text style={styles.featureItem}>• Auto-close option for success messages</Text>
            <Text style={styles.featureItem}>• Multiple button support</Text>
            <Text style={styles.featureItem}>• Customizable styling per alert type</Text>
            <Text style={styles.featureItem}>• Backdrop dismissal</Text>
          </View>
        </CardContent>
      </Card>
      
      <AlertComponent />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    gap: 24,
  },
  buttonGroup: {
    gap: 16,
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  infoButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 4,
  },
});
