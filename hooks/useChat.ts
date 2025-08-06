import { useState, useCallback, useRef, useEffect } from 'react';
import { chatService, ChatMessage } from '../services/chatService';
import { copyApiKeyFile } from '../services/fileUtils';
import { chatHistoryService, ChatSession, ChatSessionSummary } from '../services/chatHistoryService';

export interface ChatMessageUI {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat(userId: string = 'default_user') {
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
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

    // Create a new session if one doesn't exist
    if (!currentSessionId) {
      try {
        const sessionId = await chatHistoryService.createChatSession(userId);
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error('Failed to create chat session:', error);
      }
    }

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

      // Update session title based on first user message
      if (conversationHistory.current.length === 2) { // First user message + AI response
        const title = chatHistoryService.generateSessionTitle(conversationHistory.current);
        if (currentSessionId) {
          await chatHistoryService.updateSessionTitle(currentSessionId, title);
        }
      }

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
  }, [initializeChat, currentSessionId, userId]);

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

  // Chat history management functions
  const createNewChat = useCallback(async () => {
    try {
      const sessionId = await chatHistoryService.createChatSession(userId);
      setCurrentSessionId(sessionId);
      clearChat();
      await loadChatSessions();
      console.log('✅ Created new chat session:', sessionId);
    } catch (error) {
      console.error('❌ Failed to create new chat:', error);
      setError('Failed to create new chat');
    }
  }, [userId, clearChat]);

  const loadChatSessions = useCallback(async () => {
    try {
      const sessions = await chatHistoryService.getUserChatSessions(userId);
      setChatSessions(sessions);
    } catch (error) {
      console.error('❌ Failed to load chat sessions:', error);
      // Set empty array to prevent UI issues
      setChatSessions([]);
    }
  }, [userId]);

  const loadChatSession = useCallback(async (sessionId: string) => {
    try {
      const session = await chatHistoryService.loadChatSession(sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        // Convert ChatMessage[] to ChatMessageUI[]
        const uiMessages: ChatMessageUI[] = session.messages.map((msg, index) => ({
          id: `${sessionId}_${index}`,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'bot',
          timestamp: msg.role === 'user' ? new Date() : new Date(), // You might want to store actual timestamps
        }));
        setMessages(uiMessages);
        conversationHistory.current = session.messages;
        await loadChatSessions();
      }
    } catch (error) {
      console.error('❌ Failed to load chat session:', error);
      setError('Failed to load chat session');
    }
  }, []);

  const deleteChatSession = useCallback(async (sessionId: string) => {
    try {
      await chatHistoryService.deleteChatSession(sessionId);
      if (currentSessionId === sessionId) {
        await createNewChat();
      } else {
        await loadChatSessions();
      }
    } catch (error) {
      console.error('❌ Failed to delete chat session:', error);
      setError('Failed to delete chat session');
    }
  }, [currentSessionId, createNewChat, loadChatSessions]);

  const clearChatHistory = useCallback(async () => {
    if (currentSessionId) {
      try {
        await chatHistoryService.clearChatSession(currentSessionId);
        clearChat();
      } catch (error) {
        console.error('❌ Failed to clear chat history:', error);
        setError('Failed to clear chat history');
      }
    }
  }, [currentSessionId, clearChat]);

  // Save chat messages periodically
  const saveChatMessages = useCallback(async () => {
    if (currentSessionId && conversationHistory.current.length > 0) {
      try {
        await chatHistoryService.saveChatMessages(currentSessionId, conversationHistory.current);
      } catch (error) {
        console.error('❌ Failed to save chat messages:', error);
      }
    }
  }, [currentSessionId]);

  // Auto-save chat messages when they change
  useEffect(() => {
    if (conversationHistory.current.length > 0) {
      const timeoutId = setTimeout(saveChatMessages, 2000); // Save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [conversationHistory.current.length, saveChatMessages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    initializeChat,
    // Chat history functions
    createNewChat,
    loadChatSessions,
    loadChatSession,
    deleteChatSession,
    clearChatHistory,
    chatSessions,
    currentSessionId
  };
} 