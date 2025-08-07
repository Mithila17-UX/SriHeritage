# AI Chat Implementation

## Overview
This implementation adds an AI-powered chat feature to the Sri Heritage App using the DeepSeek R1 model through OpenRouter.

## Components

### 1. Chat Service (`services/chatService.ts`)
- Handles API communication with OpenRouter
- Manages API key reading from file
- Provides methods for sending messages and maintaining conversation context
- Includes proper error handling and response parsing

### 2. File Utils (`services/fileUtils.ts`)
- Handles copying the API key file from assets to document directory
- Provides fallback mechanism if file copying fails
- Ensures the API key is accessible to the app

### 3. Chat Hook (`hooks/useChat.ts`)
- Custom React hook for managing chat state
- Handles message history, loading states, and error handling
- Provides methods for sending messages and clearing chat
- Manages conversation history for context

### 4. Updated ChatScreen (`components/ChatScreen.tsx`)
- Integrates with the chat hook
- Shows loading states with activity indicators
- Displays error messages when API calls fail
- Auto-scrolls to new messages
- Maintains the existing UI design

## Features

### ✅ Implemented
- Real-time AI chat using DeepSeek R1 model
- Loading states with visual feedback
- Error handling with user-friendly messages
- Conversation history maintenance
- Auto-scrolling to new messages
- Input disabled during API calls
- Proper API key management

### 🔧 Configuration
- API Key: Stored in `assets/DeepSeekR1ChatBotAPIKey.txt`
- Model: `deepseek/deepseek-r1-0528:free`
- Base URL: `https://openrouter.ai/api/v1`
- Headers: Authorization, Content-Type, HTTP-Referer, X-Title

### 🎯 System Prompt
The AI is configured with a system prompt that specializes in Sri Lankan heritage, covering:
- Ancient Buddhist temples and religious sites
- Historical kingdoms and archaeological sites
- Traditional arts, crafts, and cultural practices
- Sri Lankan cuisine and culinary traditions
- Colonial architecture and heritage buildings
- Natural heritage sites and biodiversity
- Traditional festivals and cultural events
- Local customs and traditions

### 🎨 Visual Formatting
The AI responses are enhanced with:
- **Emojis** for visual categorization (🏛️ temples, 🏰 historical sites, 🎨 arts, etc.)
- **Bold text** for important terms and headings
- **Structured formatting** with clear sections
- **Bullet points** and numbered lists for easy reading
- **Practical tips** and recommendations
- **Location details** and visiting information

## Usage

1. **Initialization**: The chat service automatically initializes when the ChatScreen loads
2. **Sending Messages**: Users can type and send messages through the input field
3. **Loading States**: Visual feedback shows when the AI is processing
4. **Error Handling**: Graceful error messages if API calls fail
5. **Conversation**: Full conversation history is maintained for context

## Dependencies Added
- `expo-file-system`: For reading API key file
- `expo-asset`: For accessing assets

## Security Notes
- API key is stored in a text file in the assets directory
- File is copied to document directory at runtime
- No hardcoded API keys in the source code
- Proper error handling prevents API key exposure

## Testing
To test the implementation:
1. Ensure the API key file exists in `assets/DeepSeekR1ChatBotAPIKey.txt`
2. Run the app and navigate to the Chat screen
3. Send a message and verify the AI responds
4. Check that loading states and error handling work correctly

## Future Enhancements
- Add message persistence using AsyncStorage
- Implement typing indicators
- Add message reactions or feedback
- Support for image uploads in chat
- Add conversation export functionality 