import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { secureConfigService, AIConfig } from '../services/secureConfig';

export function AIConfigScreen() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  // Available models
  const availableModels = [
    { value: 'moonshotai/kimi-k2:free', label: 'Moonshot AI (Kimi K2) - Free' },
    { value: 'deepseek/deepseek-r1-0528:free', label: 'DeepSeek R1 - Free' },
    { value: 'openai/gpt-3.5-turbo', label: 'OpenAI GPT-3.5 Turbo' },
    { value: 'openai/gpt-4', label: 'OpenAI GPT-4' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'google/gemini-flash-1.5', label: 'Google Gemini Flash 1.5' },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const currentConfig = await secureConfigService.getConfig();
      if (currentConfig) {
        setConfig(currentConfig);
        setApiKey(currentConfig.apiKey);
        setModel(currentConfig.model);
        setBaseUrl(currentConfig.baseUrl);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      Alert.alert('Error', 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'API key is required');
      return;
    }

    if (!model.trim()) {
      Alert.alert('Error', 'Model is required');
      return;
    }

    if (!baseUrl.trim()) {
      Alert.alert('Error', 'Base URL is required');
      return;
    }

    try {
      setIsSaving(true);
      const newConfig: AIConfig = {
        apiKey: apiKey.trim(),
        model: model.trim(),
        baseUrl: baseUrl.trim()
      };

      await secureConfigService.saveConfig(newConfig);
      setConfig(newConfig);
      Alert.alert('Success', 'Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key to validate');
      return;
    }

    try {
      setIsValidating(true);
      const isValid = await secureConfigService.validateApiKey(apiKey.trim());
      
      if (isValid) {
        Alert.alert('Success', 'API key is valid! ✅');
      } else {
        Alert.alert('Invalid', 'API key is invalid or expired ❌');
      }
    } catch (error) {
      console.error('Validation error:', error);
      Alert.alert('Error', 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  const resetToDefault = async () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default configuration? This will overwrite your current settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureConfigService.resetToDefault();
              await loadConfig();
              Alert.alert('Success', 'Configuration reset to default');
            } catch (error) {
              console.error('Failed to reset:', error);
              Alert.alert('Error', 'Failed to reset configuration');
            }
          }
        }
      ]
    );
  };

  const selectModel = (selectedModel: string) => {
    setModel(selectedModel);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle style={styles.title}>🤖 AI Configuration</CardTitle>
          <Text style={styles.subtitle}>
            Configure your AI chatbot settings. Your API key is stored securely on this device.
          </Text>
        </CardHeader>
        
        <CardContent style={styles.cardContent}>
          {/* API Key Section */}
          <View style={styles.section}>
            <Text style={styles.label}>🔑 API Key</Text>
            <Input
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your OpenRouter API key"
              secureTextEntry={true}
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <Button
                onPress={validateApiKey}
                disabled={isValidating || !apiKey.trim()}
                variant="outline"
                style={styles.validateButton}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color="#1E3A8A" />
                ) : (
                  <Text>Validate Key</Text>
                )}
              </Button>
            </View>
          </View>

          {/* Model Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>🧠 AI Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelScroll}>
              {availableModels.map((modelOption) => (
                <Button
                  key={modelOption.value}
                  onPress={() => selectModel(modelOption.value)}
                  variant={model === modelOption.value ? "default" : "outline"}
                  style={model === modelOption.value ? 
                    {...styles.modelButton, ...styles.selectedModelButton} : 
                    styles.modelButton
                  }
                >
                  <Text style={model === modelOption.value ? 
                    {...styles.modelButtonText, ...styles.selectedModelButtonText} : 
                    styles.modelButtonText
                  }>
                    {modelOption.label}
                  </Text>
                </Button>
              ))}
            </ScrollView>
            
            {/* Custom model input */}
            <Input
              value={model}
              onChangeText={setModel}
              placeholder="Or enter custom model name"
              style={styles.input}
            />
          </View>

          {/* Base URL Section */}
          <View style={styles.section}>
            <Text style={styles.label}>🌐 Base URL</Text>
            <Input
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://openrouter.ai/api/v1"
              style={styles.input}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              onPress={saveConfig}
              disabled={isSaving || !apiKey.trim() || !model.trim() || !baseUrl.trim()}
              style={styles.saveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>💾 Save Configuration</Text>
              )}
            </Button>

            <Button
              onPress={resetToDefault}
              variant="outline"
              style={styles.resetButton}
            >
              <Text>🔄 Reset to Default</Text>
            </Button>
          </View>

          {/* Current Config Display */}
          {config && (
            <View style={styles.currentConfig}>
              <Text style={styles.currentConfigTitle}>📋 Current Configuration</Text>
              <Text style={styles.configItem}>
                🔑 API Key: {config.apiKey.substring(0, 20)}...
              </Text>
              <Text style={styles.configItem}>
                🧠 Model: {config.model}
              </Text>
              <Text style={styles.configItem}>
                🌐 Base URL: {config.baseUrl}
              </Text>
            </View>
          )}

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>❓ Need Help?</Text>
            <Text style={styles.helpText}>
              • Get your API key from OpenRouter.ai{'\n'}
              • Free models are available for testing{'\n'}
              • Your API key is stored securely on this device{'\n'}
              • Contact support if you need assistance
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
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardContent: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  validateButton: {
    flex: 1,
  },
  modelScroll: {
    marginBottom: 12,
  },
  modelButton: {
    marginRight: 8,
    paddingHorizontal: 16,
    minWidth: 120,
  },
  selectedModelButton: {
    backgroundColor: '#1E3A8A',
  },
  modelButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectedModelButtonText: {
    color: '#FFFFFF',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetButton: {
    borderColor: '#DC2626',
  },
  currentConfig: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  currentConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  configItem: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  helpSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
