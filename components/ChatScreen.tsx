import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { useChat, ChatMessageUI } from '../hooks/useChat';
import { FormattedText } from '../utils/textFormatter';
import { ChatHistoryModal } from './ChatHistoryModal';

export function ChatScreen() {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    initializeChat,
    createNewChat,
    loadChatSessions,
    loadChatSession,
    deleteChatSession,
    clearChatHistory,
    chatSessions,
    currentSessionId
  } = useChat('default_user'); // You can replace with actual user ID
  
  const [inputText, setInputText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    // Auto-scroll to show the beginning of the latest bot message
    if (scrollViewRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && !lastMessage.isLoading) {
        // For long messages, scroll to show the beginning
        // For short messages, scroll to the end
        const isLongMessage = lastMessage.text.length > 200;
        setTimeout(() => {
          if (isLongMessage) {
            // For long messages, scroll to show the beginning of the response
            // We'll scroll to the end but the scroll button will help users navigate
            scrollViewRef.current?.scrollToEnd({ animated: true });
          } else {
            // For short messages, scroll to the end
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageToSend = inputText.trim();
    setInputText('');
    await sendMessage(messageToSend);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
    setShowScrollButton(!isCloseToBottom);
  };

  // Check if the latest bot message is long enough to warrant a scroll button
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && !lastMessage.isLoading) {
        // If the message is longer than 200 characters, it's likely a long response
        const isLongMessage = lastMessage.text.length > 200;
        if (isLongMessage) {
          // Show scroll button after a short delay to let the message render
          setTimeout(() => {
            setShowScrollButton(true);
          }, 500);
        }
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    // Hide the button after scrolling to bottom
    setTimeout(() => {
      setShowScrollButton(false);
    }, 300);
  };

  const handleNewChat = async () => {
    await createNewChat();
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChatHistory }
      ]
    );
  };

  const handleSelectSession = async (sessionId: string) => {
    await loadChatSession(sessionId);
    setShowHistoryModal(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteChatSession(sessionId) }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Heritage Guide</Text>
            <Text style={styles.headerSubtitle}>Your personal tour assistant</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowHistoryModal(true)} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNewChat} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearChat} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer} 
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
            ]}
          >
            <View style={[
              styles.messageRow,
              message.sender === 'user' ? styles.userMessageRow : styles.botMessageRow
            ]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {message.sender === 'user' ? '👤' : '🤖'}
                </Text>
              </View>
              
              <Card style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.botMessage
              ] as any}>
                <CardContent style={styles.messageContent}>
                  {message.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#1E3A8A" />
                      <Text style={[styles.messageText, styles.botMessageText, styles.loadingText]}>
                        Thinking...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <FormattedText 
                        text={message.text}
                        style={[
                          styles.messageText,
                          message.sender === 'user' ? styles.userMessageText : styles.botMessageText
                        ]}
                      />
                      <Text style={[
                        styles.messageTime,
                        message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime
                      ]}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </>
                  )}
                </CardContent>
              </Card>
            </View>
          </View>
        ))}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.7}
        >
          <Text style={styles.scrollToBottomIcon}>↓</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
                      <Input
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about Sri Lankan heritage..."
              style={[styles.textInput, isLoading && styles.inputDisabled] as any}
            />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat History Modal */}
      <ChatHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        chatSessions={chatSessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        currentSessionId={currentSessionId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  header: {
    backgroundColor: '#1E3A8A', // A deep navy blue
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE', // A light blue that complements the navy
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    width: '100%',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
    gap: 8,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  botMessageRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB', // gray-200
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    flex: 1,
    maxWidth: '100%',
  },
  userMessage: {
    backgroundColor: '#1E3A8A', // A deep navy blue
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#1E3A8A',
  },
  messageContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#111827', // gray-900
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: '#93C5FD', // A light blue for contrast against navy
  },
  botMessageTime: {
    color: '#6B7280', // gray-500
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A', // A deep navy blue for consistency
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#60A5FA', // A lighter blue for the disabled state
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollToBottomIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});