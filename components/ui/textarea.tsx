import * as React from "react";
import { TextInput, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface TextareaProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  onChangeText,
  placeholder,
  style,
  textStyle,
  disabled = false,
  ...props
}) => {
  return (
    <TextInput
      style={[styles.textarea, style, textStyle]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      editable={!disabled}
      multiline
      numberOfLines={4}
      placeholderTextColor="#717182"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f3f3f5',
    color: '#030213',
    textAlignVertical: 'top',
    minHeight: 80,
  },
});

export { Textarea };
