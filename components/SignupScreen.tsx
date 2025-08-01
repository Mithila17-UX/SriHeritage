import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
import { Checkbox } from './ui/checkbox';

interface SignupScreenProps {
  onSignup: (name: string, email: string, password: string) => void;
  onNavigateToLogin: () => void;
}

export function SignupScreen({ onSignup, onNavigateToLogin }: SignupScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = () => {
    if (fullName && email && password && confirmPassword && agreeToTerms) {
      if (password === confirmPassword) {
        onSignup(fullName, email, password);
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
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
          <Text style={styles.subtitle}>Create Your Account</Text>
          <Text style={styles.description}>Join our community of explorers.</Text>
        </CardHeader>
        
        <CardContent style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Label>Full Name</Label>
              <Input
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
            </View>
            
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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Label>Confirm Password</Label>
              <Input
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                style={styles.input}
              />
            </View>
            
            <View style={styles.checkboxContainer}>
              <Checkbox
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                style={styles.checkbox}
              />
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <TouchableOpacity>
                    <Text style={styles.termsLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  {' '}and{' '}
                  <TouchableOpacity>
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  .
                </Text>
              </View>
            </View>
            
            <Button
              onPress={handleSubmit}
              disabled={!agreeToTerms}
              style={[styles.signupButton, !agreeToTerms && styles.signupButtonDisabled]}
            >
              Sign Up
            </Button>
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkbox: {
    marginTop: 4,
  },
  termsContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
    lineHeight: 20,
  },
  termsLink: {
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  signupButton: {
    backgroundColor: '#EA580C', // orange-600
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonDisabled: {
    backgroundColor: '#FB923C', // orange-400
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  loginLink: {
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
});