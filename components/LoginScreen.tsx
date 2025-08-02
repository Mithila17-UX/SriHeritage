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
  const [showPassword, setShowPassword] = useState(false);

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
              <Label style={styles.label}>Email Address</Label>
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
              <Label style={styles.label}>Password</Label>
              <View style={styles.passwordContainer}>
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
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
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignup}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF', // A light, inviting blue shade
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
    backgroundColor: '#FFFFFF', // Clean white background for the card
    borderRadius: 24, // Softer, more modern rounded corners
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
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
    backgroundColor: '#0EA5E9', // Sky blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoMiddle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7', // A deeper sky blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0369A1', // An even deeper sky blue
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
    backgroundColor: '#075985', // The deepest sky blue
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075985', // Dark blue for high contrast
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#0369A1', // Medium blue for subheadings
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#0284C7', // Lighter blue for descriptions
    textAlign: 'center',
  },
  content: {
    gap: 24,
    paddingBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#075985',
    fontWeight: '600',
  },
  input: {
    borderColor: '#93C5FD', // A calm blue for the input border
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    borderColor: '#93C5FD', // A calm blue for the input border
    flex: 1,
    paddingRight: 40, // Add padding to prevent text overlap with the button
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0EA5E9', // A vibrant sky blue for links
  },
  loginButton: {
    backgroundColor: '#0EA5E9', // A vibrant sky blue for the main button
    width: '100%',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#075985', // Dark blue for better readability
  },
  signupLink: {
    color: '#0EA5E9', // A vibrant sky blue for links
    fontWeight: '500',
  },
});