import * as React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface AvatarProps {
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
  children?: React.ReactNode;
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
}

function Avatar({ style, children, ...props }: AvatarProps) {
  return (
    <View style={[styles.avatar, style]} {...props}>
      {children}
    </View>
  );
}

function AvatarImage({ src, alt, style, ...props }: AvatarImageProps) {
  if (!src) return null;
  
  return (
    <Image
      source={{ uri: src }}
      style={[styles.avatarImage, style]}
      accessibilityLabel={alt}
      {...props}
    />
  );
}

function AvatarFallback({ children, style, ...props }: AvatarFallbackProps) {
  return (
    <View style={[styles.avatarFallback, style]} {...props}>
      <Text style={styles.avatarFallbackText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6', // gray-100
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
});

export { Avatar, AvatarImage, AvatarFallback };