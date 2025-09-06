import * as React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { wrapTextChildren } from "./text-wrapper";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardActionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {wrapTextChildren(children)}
    </View>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {wrapTextChildren(children)}
    </View>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {wrapTextChildren(children)}
    </View>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.cardTitle, style]} {...props}>
      {children}
    </Text>
  );
};

const CardDescription: React.FC<CardDescriptionProps> = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.cardDescription, style]} {...props}>
      {children}
    </Text>
  );
};

const CardAction: React.FC<CardActionProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardAction, style]} {...props}>
      {wrapTextChildren(children)}
    </View>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {wrapTextChildren(children)}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#717182',
    lineHeight: 20,
  },
  cardAction: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  cardFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
