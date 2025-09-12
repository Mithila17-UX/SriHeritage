import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class GeminiChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly apiKey = 'AIzaSyDk0YTqNKlsNVo2uj__QsiwoYgvQHq45mc';
  private readonly modelName = 'gemini-1.5-flash';
  private isInitialized = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.isInitialized = true;
      console.log('✅ Gemini chat service initialized successfully');
      console.log('🧠 Using model:', this.modelName);
    } catch (error) {
      console.error('❌ Failed to initialize Gemini chat service:', error);
      throw new Error('Failed to initialize Gemini chat service');
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Convert our messages format to Gemini format
      const geminiMessages = this.convertToGeminiFormat(messages);
      
      // Generate content
      const result = await this.model.generateContent(geminiMessages);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini model');
      }

      console.log('✅ Gemini response received successfully');
      return text;
    } catch (error: any) {
      console.error('❌ Gemini API error:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('API key')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      } else if (error?.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error?.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}`);
      }
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

  private convertToGeminiFormat(messages: ChatMessage[]): string {
    // For Gemini, we'll combine all messages into a single prompt
    // The system message sets the context, then we add the conversation
    let prompt = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `Human: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }
    
    return prompt;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testModel = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await testModel.generateContent('Hello');
      const response = await result.response;
      return !!response.text();
    } catch (error: any) {
      console.error('❌ Gemini API key validation failed:', error);
      return false;
    }
  }
}

export const geminiChatService = new GeminiChatService();
