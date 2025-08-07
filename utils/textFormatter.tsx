import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface FormattedTextProps {
  text: string;
  style?: any;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, style }) => {
  // Simple formatting for bold text and emojis
  const formatText = (text: string) => {
    // Split text by bold markers
    const parts = text.split(/\*\*(.*?)\*\*/);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is bold text
        return (
          <Text key={index} style={[style, { fontWeight: 'bold' }]}>
            {part}
          </Text>
        );
      } else {
        // This is regular text
        return (
          <Text key={index} style={style}>
            {part}
          </Text>
        );
      }
    });
  };

  return (
    <Text style={style}>
      {formatText(text)}
    </Text>
  );
};

// Helper function to check if text contains formatting
export const hasFormatting = (text: string): boolean => {
  return /\*\*.*?\*\*/.test(text) || /[🏛️🏰🎨🍛🌿🎉💡📍����]/.test(text);
}; 