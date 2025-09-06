import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import NoRerenderForm from './NoRerenderForm';

/**
 * Test component to verify absolutely zero re-renders
 */
const ZeroRerenderTest = () => {
  console.log('🧪 Test component mounted');

  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Re-render Test</Text>
        <Text style={styles.subtitle}>
          This component has rendered {renderCount.current} times
        </Text>
        <Text style={styles.description}>
          The form below should allow typing and rating without causing any re-renders.
          Check the console logs to verify zero re-renders during typing.
        </Text>
      </View>

      {/* The component that should never re-render during input */}
      <NoRerenderForm />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ If this works, you should be able to type and rate without any component reloads.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#4A5568',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#718096',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    margin: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#2C5282',
    textAlign: 'center',
  }
});

export default ZeroRerenderTest;
