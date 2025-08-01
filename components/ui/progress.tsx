import * as React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface ProgressProps {
  value?: number;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  style,
  ...props
}) => {
  const progressValue = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.progressContainer, style]} {...props}>
      <View 
        style={[
          styles.progressIndicator, 
          { width: `${progressValue}%` }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(3, 2, 19, 0.2)', // primary/20
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#030213', // primary
    borderRadius: 4,
  },
});

export { Progress };
