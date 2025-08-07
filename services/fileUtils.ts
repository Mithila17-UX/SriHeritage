import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function copyApiKeyFile(): Promise<void> {
  try {
    // Check if the file already exists in document directory
    const documentPath = FileSystem.documentDirectory + 'DeepSeekR1ChatBotAPIKey.txt';
    const fileInfo = await FileSystem.getInfoAsync(documentPath);
    
    if (fileInfo.exists) {
      console.log('API key file already exists in document directory');
      return;
    }

    // Copy from assets to document directory
    const asset = Asset.fromModule(require('../assets/DeepSeekR1ChatBotAPIKey.txt'));
    await asset.downloadAsync();
    
    if (asset.localUri) {
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: documentPath
      });
      console.log('API key file copied to document directory');
    }
  } catch (error) {
    console.error('Failed to copy API key file:', error);
    // Fallback: create a simple text file with the API key
    const apiKey = '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';
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + 'DeepSeekR1ChatBotAPIKey.txt',
      `API_KEY=${apiKey}`
    );
    console.log('Created fallback API key file');
  }
} 