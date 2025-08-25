import { secureConfigService } from './secureConfig';

export async function copyApiKeyFile(): Promise<void> {
  try {
    // Initialize the secure configuration service
    await secureConfigService.initialize();
    console.log('✅ Secure configuration initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize secure configuration:', error);
    throw new Error('Failed to initialize secure configuration');
  }
} 