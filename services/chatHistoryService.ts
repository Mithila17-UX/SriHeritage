import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './firebase';
import { ChatMessage } from './chatService';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

class ChatHistoryService {
  private readonly COLLECTION_NAME = 'chat_sessions';

  // Create a new chat session
  async createChatSession(userId: string, title: string = 'New Chat'): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Timestamp.now();
      
      const session: ChatSession = {
        id: sessionId,
        userId,
        title,
        messages: [],
        createdAt: now,
        updatedAt: now,
        isActive: true
      };

      await setDoc(doc(firestore, this.COLLECTION_NAME, sessionId), session);
      console.log('✅ Created new chat session:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create chat session:', error);
      throw error;
    }
  }

  // Save chat messages to a session
  async saveChatMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const sessionRef = doc(firestore, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Chat session not found');
      }

      const sessionData = sessionDoc.data() as ChatSession;
      const updatedSession: ChatSession = {
        ...sessionData,
        messages,
        updatedAt: Timestamp.now()
      };

      await setDoc(sessionRef, updatedSession);
      console.log('✅ Saved chat messages to session:', sessionId);
    } catch (error) {
      console.error('❌ Failed to save chat messages:', error);
      throw error;
    }
  }

  // Load a specific chat session
  async loadChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionRef = doc(firestore, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        console.log('⚠️ Chat session not found:', sessionId);
        return null;
      }

      const sessionData = sessionDoc.data() as ChatSession;
      console.log('✅ Loaded chat session:', sessionId);
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to load chat session:', error);
      throw error;
    }
  }

  // Get all chat sessions for a user
  async getUserChatSessions(userId: string): Promise<ChatSessionSummary[]> {
    try {
      // First try with the composite index
      const sessionsQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions: ChatSessionSummary[] = [];
      
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data() as ChatSession;
        sessions.push({
          id: data.id,
          title: data.title,
          messageCount: data.messages.length,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isActive: data.isActive
        });
      });

      console.log('✅ Loaded chat sessions for user:', userId, sessions.length);
      return sessions;
    } catch (error: any) {
      // If the composite index doesn't exist, fall back to a simpler query
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.log('⚠️ Composite index not found, using fallback query...');
        return this.getUserChatSessionsFallback(userId);
      }
      console.error('❌ Failed to load user chat sessions:', error);
      throw error;
    }
  }

  // Fallback method without composite index
  private async getUserChatSessionsFallback(userId: string): Promise<ChatSessionSummary[]> {
    try {
      const sessionsQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions: ChatSessionSummary[] = [];
      
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data() as ChatSession;
        sessions.push({
          id: data.id,
          title: data.title,
          messageCount: data.messages.length,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isActive: data.isActive
        });
      });

      // Sort in memory since we can't use orderBy in the query
      sessions.sort((a, b) => {
        const dateA = a.updatedAt instanceof Timestamp ? a.updatedAt.toDate() : new Date(a.updatedAt as any);
        const dateB = b.updatedAt instanceof Timestamp ? b.updatedAt.toDate() : new Date(b.updatedAt as any);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('✅ Loaded chat sessions (fallback) for user:', userId, sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Failed to load user chat sessions (fallback):', error);
      return [];
    }
  }

  // Update session title
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      const sessionRef = doc(firestore, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Chat session not found');
      }

      const sessionData = sessionDoc.data() as ChatSession;
      const updatedSession: ChatSession = {
        ...sessionData,
        title,
        updatedAt: Timestamp.now()
      };

      await setDoc(sessionRef, updatedSession);
      console.log('✅ Updated session title:', sessionId, title);
    } catch (error) {
      console.error('❌ Failed to update session title:', error);
      throw error;
    }
  }

  // Delete a chat session
  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, this.COLLECTION_NAME, sessionId));
      console.log('✅ Deleted chat session:', sessionId);
    } catch (error) {
      console.error('❌ Failed to delete chat session:', error);
      throw error;
    }
  }

  // Clear all messages from a session (but keep the session)
  async clearChatSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(firestore, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Chat session not found');
      }

      const sessionData = sessionDoc.data() as ChatSession;
      const updatedSession: ChatSession = {
        ...sessionData,
        messages: [],
        updatedAt: Timestamp.now()
      };

      await setDoc(sessionRef, updatedSession);
      console.log('✅ Cleared chat session:', sessionId);
    } catch (error) {
      console.error('❌ Failed to clear chat session:', error);
      throw error;
    }
  }

  // Generate a title for the chat session based on the first user message
  generateSessionTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const text = firstUserMessage.content;
      // Take first 30 characters and add ellipsis if longer
      return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }
    return 'New Chat';
  }
}

export const chatHistoryService = new ChatHistoryService(); 