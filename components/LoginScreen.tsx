import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export function LoginScreen({ onLogin, onNavigateToSignup, onNavigateToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <CardHeader style={styles.header}>
          {/* Sri Lankan Moonstone-inspired Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoMiddle}>
                <View style={styles.logoInner}>
                  <View style={styles.logoCenter}>
                    <View style={styles.logoCore}></View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>Sri Heritage</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>
          <Text style={styles.description}>Explore the rich heritage of Sri Lanka.</Text>
        </CardHeader>
        
        <CardContent style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Label>Email Address</Label>
              <Input
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Label>Password</Label>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                style={styles.input}
              />
            </View>
            
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={onNavigateToForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            
            <Button
              onPress={handleSubmit}
              style={styles.loginButton}
            >
              Login
            </Button>
          </View>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B', // amber-500
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoMiddle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EA580C', // orange-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626', // red-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCenter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#B91C1C', // red-700
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#1F2937', // gray-800
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#EA580C', // orange-600
  },
  loginButton: {
    backgroundColor: '#EA580C', // orange-600
    width: '100%',
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  signupLink: {
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
});