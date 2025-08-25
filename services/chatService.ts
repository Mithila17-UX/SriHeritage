import { secureConfigService } from './secureConfig';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await secureConfigService.initialize();
      this.isInitialized = true;
      console.log('✅ Chat service initialized with secure config');
    } catch (error) {
      console.error('❌ Failed to initialize chat service:', error);
      throw new Error('Failed to initialize chat service');
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const apiKey = await secureConfigService.getApiKey();
      const model = await secureConfigService.getModel();
      const baseUrl = await secureConfigService.getBaseUrl();

      if (!apiKey) {
        throw new Error('API key not available');
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sriheritage.app',
          'X-Title': 'Sri Heritage AI Guide'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', response.status, errorData);
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`API request failed: ${response.status}`);
        }
      }

      const data: ChatResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response from AI model');
      }
    } catch (error) {
      console.error('❌ Chat API error:', error);
      throw error;
    }
  }

  async sendMessageWithContext(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a knowledgeable AI guide specializing in Sri Lankan heritage, culture, and history. You help visitors and locals learn about:

- Ancient Buddhist temples and religious sites
- Historical kingdoms and archaeological sites
- Traditional arts, crafts, and cultural practices
- Sri Lankan cuisine and culinary traditions
- Colonial architecture and heritage buildings
- Natural heritage sites and biodiversity
- Traditional festivals and cultural events
- Local customs and traditions

IMPORTANT FORMATTING GUIDELINES:
1. Use clear headings with emojis for visual appeal
2. Organize information with bullet points and numbered lists
3. Use bold text for important terms and names
4. Add relevant emojis to make content engaging
5. Structure responses with clear sections
6. Use spacing and formatting to improve readability
7. Include practical tips and recommendations when relevant
8. Add cultural context and historical significance
9. Use friendly, conversational tone while being informative
10. Include location details and visiting information when applicable

Example format:
🏛️ **Temple Name**
📍 Location: [specific location]
📅 Best Time to Visit: [recommendations]
🎯 Significance: [historical/cultural importance]
💡 Tips: [practical advice]

For different topics, use appropriate emojis:
• 🏛️ for temples and religious sites
• 🏰 for historical sites and palaces
• 🎨 for arts and culture
• 🍛 for food and cuisine
• 🌿 for natural heritage
• 🎉 for festivals and celebrations
• 💡 for tips and practical information
• 📍 for locations
• 📅 for timing and schedules
• 🎯 for significance and importance

Provide informative, engaging, and visually appealing responses. Be conversational but professional. If you're unsure about something, acknowledge it and suggest where they might find more information.`
    };

    const messages: ChatMessage[] = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    return await this.sendMessage(messages);
  }
}

export const chatService = new ChatService(); 