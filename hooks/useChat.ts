import { useState, useCallback, useRef } from 'react';
import { chatService, ChatMessage } from '../services/chatService';
import { copyApiKeyFile } from '../services/fileUtils';

export interface ChatMessageUI {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageUI[]>([
    {
      id: '1',
      text: `🌟 **Welcome to Sri Lankan Heritage Guide!** 🌟

I'm your AI assistant specializing in Sri Lanka's rich cultural heritage. Here's what I can help you explore:

🏛️ **Sacred Sites & Temples**
• Ancient Buddhist temples and stupas
• Hindu temples and religious complexes
• Sacred pilgrimage sites

🏰 **Historical Kingdoms**
• Ancient cities and archaeological sites
• Royal palaces and fortresses
• UNESCO World Heritage Sites

🎨 **Arts & Culture**
• Traditional dance forms (Kandyan, Sabaragamuwa, Low Country)
• Traditional crafts and handicrafts
• Classical music and instruments

🍛 **Culinary Heritage**
• Traditional Sri Lankan cuisine
• Regional specialties and spices
• Traditional cooking methods

🏛️ **Colonial Architecture**
• Portuguese, Dutch, and British influences
• Historic buildings and monuments
• Heritage conservation sites

🌿 **Natural Heritage**
• Sacred groves and natural sites
• Biodiversity and conservation areas
• Traditional ecological knowledge

🎉 **Festivals & Celebrations**
• Religious festivals and ceremonies
• Cultural events and traditions
• Seasonal celebrations

💡 **Practical Information**
• Best times to visit
• Cultural etiquette and customs
• Travel tips and recommendations

What aspect of Sri Lankan heritage would you like to explore? I'm here to provide detailed, engaging information with practical tips!`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationHistory = useRef<ChatMessage[]>([]);
  const isInitialized = useRef(false);

  const initializeChat = useCallback(async () => {
    if (isInitialized.current) return;
    
    try {
      await copyApiKeyFile();
      await chatService.initialize();
      isInitialized.current = true;
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      setError('Failed to initialize chat service');
    }
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message to UI
    const userMessageUI: ChatMessageUI = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessageUI]);

    // Add loading message
    const loadingMessage: ChatMessageUI = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Initialize chat service if not already done
      await initializeChat();

      // Add user message to conversation history
      const userChatMessage: ChatMessage = {
        role: 'user',
        content: userMessage
      };
      conversationHistory.current.push(userChatMessage);

      // Get AI response
      const aiResponse = await chatService.sendMessageWithContext(
        userMessage,
        conversationHistory.current
      );

      // Add AI response to conversation history
      const aiChatMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse
      };
      conversationHistory.current.push(aiChatMessage);

      // Update UI with AI response
      setMessages(prev => prev.map(msg => 
        msg.isLoading 
          ? {
              ...msg,
              text: aiResponse,
              isLoading: false
            }
          : msg
      ));

    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');
      
      // Update loading message with error
      setMessages(prev => prev.map(msg => 
        msg.isLoading 
          ? {
              ...msg,
              text: 'Sorry, I encountered an error. Please try again.',
              isLoading: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [initializeChat]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        text: `🌟 **Welcome to Sri Lankan Heritage Guide!** 🌟

I'm your AI assistant specializing in Sri Lanka's rich cultural heritage. Here's what I can help you explore:

🏛️ **Sacred Sites & Temples**
• Ancient Buddhist temples and stupas
• Hindu temples and religious complexes
• Sacred pilgrimage sites

🏰 **Historical Kingdoms**
• Ancient cities and archaeological sites
• Royal palaces and fortresses
• UNESCO World Heritage Sites

🎨 **Arts & Culture**
• Traditional dance forms (Kandyan, Sabaragamuwa, Low Country)
• Traditional crafts and handicrafts
• Classical music and instruments

🍛 **Culinary Heritage**
• Traditional Sri Lankan cuisine
• Regional specialties and spices
• Traditional cooking methods

🏛️ **Colonial Architecture**
• Portuguese, Dutch, and British influences
• Historic buildings and monuments
• Heritage conservation sites

🌿 **Natural Heritage**
• Sacred groves and natural sites
• Biodiversity and conservation areas
• Traditional ecological knowledge

🎉 **Festivals & Celebrations**
• Religious festivals and ceremonies
• Cultural events and traditions
• Seasonal celebrations

💡 **Practical Information**
• Best times to visit
• Cultural etiquette and customs
• Travel tips and recommendations

What aspect of Sri Lankan heritage would you like to explore? I'm here to provide detailed, engaging information with practical tips!`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    conversationHistory.current = [];
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    initializeChat
  };
} 