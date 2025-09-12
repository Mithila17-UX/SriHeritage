import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { useCustomAlert } from './ui/custom-alert';

interface SignupScreenProps {
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

export function SignupScreen({ onSignup, onNavigateToLogin }: SignupScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showError, showWarning, AlertComponent } = useCustomAlert();

  const handleSubmit = async () => {
    // Clear previous errors
    setError(null);

    // Validation
    if (!fullName.trim()) {
      showError('Missing Information', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      showError('Missing Information', 'Please enter your email address');
      return;
    }

    if (!password) {
      showError('Missing Information', 'Please create a password');
      return;
    }

    if (!confirmPassword) {
      showError('Missing Information', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      showError('Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      showWarning('Weak Password', 'Password should be at least 6 characters long for better security.');
      return;
    }

    if (!agreeToTerms) {
      showWarning('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    try {
      setIsLoading(true);
      await onSignup(fullName.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      showError('Sign Up Failed', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
              <Label style={styles.label}>Full Name</Label>
              <Input
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
            </View>
            
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
                  placeholder="Create a password"
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
            
            <View style={styles.inputGroup}>
              <Label style={styles.label}>Confirm Password</Label>
              <View style={styles.passwordContainer}>
                <Input
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.passwordToggleText}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.checkboxContainer}>
              <Checkbox
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                style={styles.checkbox}
              />
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>I agree to the </Text>
                <TouchableOpacity>
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>.</Text>
              </View>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              onPress={handleSubmit}
              disabled={!agreeToTerms || isLoading}
              style={[
                styles.signupButton, 
                (!agreeToTerms || isLoading) && styles.signupButtonDisabled
              ]}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#075985', // Dark blue for better readability
    lineHeight: 20,
  },
  termsLink: {
    color: '#0EA5E9', // A vibrant sky blue for links
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#0EA5E9', // A vibrant sky blue for the main button
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonDisabled: {
    backgroundColor: '#7DD3FC', // A lighter, disabled-looking blue
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#075985', // Dark blue for better readability
  },
  loginLink: {
    color: '#0EA5E9', // A vibrant sky blue for links
    fontWeight: '500',
  },
});