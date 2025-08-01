import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
// Note: Avatar component would need to be converted to React Native
// import { Avatar, AvatarFallback } from './ui/avatar';
// import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Hello! I'm your Sri Lankan heritage guide. I can help you learn about our rich cultural history, ancient temples, colonial architecture, and traditional arts. What would you like to know?",
    sender: 'bot',
    timestamp: new Date()
  }
];

const botResponses = [
  "The Temple of the Sacred Tooth Relic in Kandy is one of Sri Lanka's most sacred Buddhist sites. It houses a tooth relic of the Buddha and is a UNESCO World Heritage Site.",
  "Sigiriya, also known as Lion Rock, is an ancient rock fortress built in the 5th century. It features beautiful frescoes and sophisticated water gardens.",
  "Sri Lankan traditional dance includes Kandyan, Sabaragamuwa, and low country styles. Each has unique costumes, music, and cultural significance.",
  "The ancient cities of Anuradhapura and Polonnaruwa showcase Sri Lanka's Buddhist heritage with magnificent stupas, monasteries, and irrigation systems.",
  "Sri Lankan cuisine blends spices like cinnamon, cardamom, and cloves with rice, coconut, and fresh seafood, reflecting centuries of cultural exchange."
];

export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
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
          <View style={styles.botAvatar}>
            <Text style={styles.botIcon}>🤖</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
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
              ]}>
                <CardContent style={styles.messageContent}>
                  <Text style={[
                    styles.messageText,
                    message.sender === 'user' ? styles.userMessageText : styles.botMessageText
                  ]}>
                    {message.text}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime
                  ]}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </CardContent>
              </Card>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Input
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Sri Lankan heritage..."
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  botAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botIcon: {
    fontSize: 24,
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
  },
  messageContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#111827', // gray-900
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
});