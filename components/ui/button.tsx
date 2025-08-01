import * as React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
  type?: 'button' | 'submit'; // Keep for compatibility but won't be used
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}_text`],
    disabled && styles.disabled_text,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={buttonTextStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Variants
  default: {
    backgroundColor: '#030213',
  },
  default_text: {
    color: '#ffffff',
  },
  destructive: {
    backgroundColor: '#d4183d',
  },
  destructive_text: {
    color: '#ffffff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  outline_text: {
    color: '#030213',
  },
  secondary: {
    backgroundColor: '#ececf0',
  },
  secondary_text: {
    color: '#030213',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghost_text: {
    color: '#030213',
  },
  link: {
    backgroundColor: 'transparent',
  },
  link_text: {
    color: '#030213',
    textDecorationLine: 'underline',
  },
  // Sizes
  size_default: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  size_sm: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  size_lg: {
    height: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  size_icon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  disabled_text: {
    opacity: 0.5,
  },
});

export { Button };
