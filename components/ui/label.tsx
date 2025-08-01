import * as React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";

interface LabelProps {
  children: React.ReactNode;
  style?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
  htmlFor?: string; // Keep for compatibility but won't be used
}

const Label: React.FC<LabelProps> = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#030213',
    marginBottom: 4,
  },
});

export { Label };
