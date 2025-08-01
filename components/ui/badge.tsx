import * as React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
  textStyle,
  ...props
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]} {...props}>
      <Text style={[styles.text, styles[`${variant}_text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Variants
  default: {
    backgroundColor: '#030213',
    borderColor: 'transparent',
  },
  default_text: {
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#ececf0',
    borderColor: 'transparent',
  },
  secondary_text: {
    color: '#030213',
  },
  destructive: {
    backgroundColor: '#d4183d',
    borderColor: 'transparent',
  },
  destructive_text: {
    color: '#ffffff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  outline_text: {
    color: '#030213',
  },
});

export { Badge };
