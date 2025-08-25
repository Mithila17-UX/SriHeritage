import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

interface AIConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

class SecureConfigService {
  private readonly CONFIG_KEY = 'ai_config';
  private readonly API_KEY_FILE = 'ChatBotAPIKey.txt';
  
  // Default configuration
  private readonly defaultConfig: AIConfig = {
    apiKey: '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',
    model: 'moonshotai/kimi-k2:free',
    baseUrl: 'https://openrouter.ai/api/v1'
  };

  /**
   * Initialize secure configuration storage
   */
  async initialize(): Promise<void> {
    try {
      // Force refresh - clear any cached config and use the latest default
      await this.saveConfig(this.defaultConfig);
      
      // Also create backup file in document directory
      await this.createBackupFile(this.defaultConfig);
      
      console.log('✅ Secure config initialized successfully with latest API key');
      console.log('🔑 Using API key:', this.defaultConfig.apiKey.substring(0, 20) + '...');
      console.log('🧠 Using model:', this.defaultConfig.model);
    } catch (error) {
      console.error('❌ Failed to initialize secure config:', error);
      throw new Error('Failed to initialize secure configuration');
    }
  }

  /**
   * Get AI configuration from secure storage
   */
  async getConfig(): Promise<AIConfig | null> {
    try {
      const configString = await SecureStore.getItemAsync(this.CONFIG_KEY);
      if (configString) {
        return JSON.parse(configString);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get config from secure store:', error);
      // Fallback to file system
      return await this.getConfigFromFile();
    }
  }

  /**
   * Save AI configuration to secure storage
   */
  async saveConfig(config: AIConfig): Promise<void> {
    try {
      const configString = JSON.stringify(config);
      await SecureStore.setItemAsync(this.CONFIG_KEY, configString);
      
      // Also save to backup file
      await this.createBackupFile(config);
      
      console.log('✅ Config saved successfully');
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(newApiKey: string): Promise<void> {
    try {
      const config = await this.getConfig() || this.defaultConfig;
      config.apiKey = newApiKey;
      await this.saveConfig(config);
      console.log('✅ API key updated successfully');
    } catch (error) {
      console.error('❌ Failed to update API key:', error);
      throw new Error('Failed to update API key');
    }
  }

  /**
   * Update AI model
   */
  async updateModel(newModel: string): Promise<void> {
    try {
      const config = await this.getConfig() || this.defaultConfig;
      config.model = newModel;
      await this.saveConfig(config);
      console.log('✅ AI model updated successfully');
    } catch (error) {
      console.error('❌ Failed to update model:', error);
      throw new Error('Failed to update AI model');
    }
  }

  /**
   * Get API key (convenience method)
   */
  async getApiKey(): Promise<string> {
    const config = await this.getConfig();
    return config?.apiKey || this.defaultConfig.apiKey;
  }

  /**
   * Get AI model (convenience method)
   */
  async getModel(): Promise<string> {
    const config = await this.getConfig();
    return config?.model || this.defaultConfig.model;
  }

  /**
   * Get base URL (convenience method)
   */
  async getBaseUrl(): Promise<string> {
    const config = await this.getConfig();
    return config?.baseUrl || this.defaultConfig.baseUrl;
  }

  /**
   * Create backup file in document directory
   */
  private async createBackupFile(config: AIConfig): Promise<void> {
    try {
      const filePath = FileSystem.documentDirectory + this.API_KEY_FILE;
      const fileContent = `# AI Configuration Backup
# Generated on: ${new Date().toISOString()}
API_KEY=${config.apiKey}
MODEL=${config.model}
BASE_URL=${config.baseUrl}
`;
      
      await FileSystem.writeAsStringAsync(filePath, fileContent);
      console.log('✅ Backup file created successfully');
    } catch (error) {
      console.error('❌ Failed to create backup file:', error);
    }
  }

  /**
   * Fallback: Get config from file system
   */
  private async getConfigFromFile(): Promise<AIConfig | null> {
    try {
      const filePath = FileSystem.documentDirectory + this.API_KEY_FILE;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        
        const apiKeyMatch = content.match(/API_KEY=([^\s\n\r]+)/);
        const modelMatch = content.match(/MODEL=([^\s\n\r]+)/);
        const baseUrlMatch = content.match(/BASE_URL=([^\s\n\r]+)/);
        
        if (apiKeyMatch) {
          return {
            apiKey: apiKeyMatch[1],
            model: modelMatch?.[1] || this.defaultConfig.model,
            baseUrl: baseUrlMatch?.[1] || this.defaultConfig.baseUrl
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get config from file:', error);
      return null;
    }
  }

  /**
   * Clear cached configuration and reinitialize
   */
  async clearAndReinitialize(): Promise<void> {
    try {
      // Clear from secure store
      await SecureStore.deleteItemAsync(this.CONFIG_KEY);
      console.log('✅ Cleared cached configuration');
      
      // Reinitialize with fresh config
      await this.initialize();
    } catch (error) {
      console.error('❌ Failed to clear and reinitialize:', error);
      throw new Error('Failed to clear configuration');
    }
  }

  /**
   * Reset to default configuration
   */
  async resetToDefault(): Promise<void> {
    try {
      await this.saveConfig(this.defaultConfig);
      console.log('✅ Configuration reset to default');
    } catch (error) {
      console.error('❌ Failed to reset configuration:', error);
      throw new Error('Failed to reset configuration');
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey?: string): Promise<boolean> {
    try {
      const keyToTest = apiKey || await this.getApiKey();
      const model = await this.getModel();
      const baseUrl = await this.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sriheritage.app',
          'X-Title': 'Sri Heritage AI Guide'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ API key validation failed:', error);
      return false;
    }
  }
}

export const secureConfigService = new SecureConfigService();
export type { AIConfig };
