import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
// Note: Replace lucide-react icons with React Native compatible icons
// import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (email) {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <CardHeader style={styles.header}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.description}>We've sent password reset instructions to your email address.</Text>
          </CardHeader>
          
          <CardContent style={styles.content}>
            <View style={styles.emailSentContainer}>
              <View style={styles.emailSentContent}>
                <Text style={styles.mailIcon}>✉️</Text>
                <View style={styles.emailSentText}>
                  <Text style={styles.emailSentLabel}>Email sent to:</Text>
                  <Text style={styles.emailSentAddress}>{email}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>If you don't receive the email within a few minutes:</Text>
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>• Check your spam/junk folder</Text>
                <Text style={styles.instructionItem}>• Make sure you entered the correct email</Text>
                <Text style={styles.instructionItem}>• Try requesting a new reset link</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                onPress={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                style={styles.tryDifferentButton}
              >
                Try Different Email
              </Button>
              
              <Button
                onPress={onBackToLogin}
                style={styles.backToLoginButton}
              >
                Back to Login
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <CardHeader style={styles.header}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              onPress={onBackToLogin}
              style={styles.backButton}
            >
              <Text style={styles.backButtonIcon}>←</Text>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.mailIcon}>✉️</Text>
          </View>
          
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.description}>No worries! Enter your email and we'll send you reset instructions.</Text>
        </CardHeader>
        
        <CardContent style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Label>Email Address</Label>
              <Input
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <Text style={styles.inputHint}>
                We'll send reset instructions to this email address.
              </Text>
            </View>
            
            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </View>
          
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Remember your password?{' '}
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED', // Equivalent to bg-gradient-to-br from-amber-50 via-orange-50 to-red-50
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  backButtonContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonIcon: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FED7AA', // orange-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7', // green-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mailIcon: {
    fontSize: 28,
  },
  successIcon: {
    fontSize: 28,
    color: '#16A34A', // green-600
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    gap: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    borderColor: '#D1D5DB', // gray-300
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  submitButton: {
    backgroundColor: '#EA580C', // orange-600
    width: '100%',
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  signInLink: {
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  // Success screen styles
  emailSentContainer: {
    backgroundColor: '#F0FDF4', // green-50
    borderWidth: 1,
    borderColor: '#BBF7D0', // green-200
    borderRadius: 8,
    padding: 16,
  },
  emailSentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emailSentText: {
    flex: 1,
  },
  emailSentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534', // green-800
    marginBottom: 4,
  },
  emailSentAddress: {
    fontSize: 14,
    color: '#15803D', // green-700
  },
  instructionsContainer: {
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  instructionsList: {
    gap: 4,
    marginLeft: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#4B5563', // gray-600
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  tryDifferentButton: {
    width: '100%',
  },
  backToLoginButton: {
    backgroundColor: '#EA580C', // orange-600
    width: '100%',
  },
});