import * as React from "react";
import { TextInput, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface InputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: { target: { value: string } }) => void; // Web compatibility
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  className?: string; // Keep for compatibility but won't be used
  type?: string; // Keep for compatibility
  id?: string; // Keep for compatibility
  required?: boolean; // Keep for compatibility
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  onChange,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  textStyle,
  disabled = false,
  type,
  ...props
}) => {
  // Handle web-style onChange events
  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    if (onChange) {
      onChange({ target: { value: text } });
    }
  };

  // Convert web input types to React Native equivalents
  let rnKeyboardType = keyboardType;
  let rnSecureTextEntry = secureTextEntry;
  let rnAutoCapitalize = autoCapitalize;

  if (type === 'email') {
    rnKeyboardType = 'email-address';
    rnAutoCapitalize = 'none';
  } else if (type === 'password') {
    rnSecureTextEntry = true;
    rnAutoCapitalize = 'none';
  }

  return (
    <TextInput
      style={[styles.input, style, textStyle]}
      value={value}
      onChangeText={handleChangeText}
      placeholder={placeholder}
      secureTextEntry={rnSecureTextEntry}
      keyboardType={rnKeyboardType}
      autoCapitalize={rnAutoCapitalize}
      editable={!disabled}
      placeholderTextColor="#717182"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f3f3f5',
    color: '#030213',
  },
});

export { Input };
