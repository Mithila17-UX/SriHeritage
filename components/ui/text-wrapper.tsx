import * as React from "react";
import { Text } from "react-native";

/**
 * Recursively wraps any string or number children in Text components
 * to prevent "Text strings must be rendered within a <Text> component" warnings
 */
export function wrapTextChildren(nodes: React.ReactNode): React.ReactNode {
  return React.Children.map(nodes, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <Text>{child}</Text>;
    }
    
    if (React.isValidElement(child)) {
      const childProps = child.props as any;
      
      if (childProps && childProps.children !== undefined) {
        // If it's already a Text element, keep children as-is,
        // otherwise recursively make its children safe
        const isText = child.type === Text;
        
        return React.cloneElement(
          child,
          {},
          isText ? childProps.children : wrapTextChildren(childProps.children)
        );
      }
    }
    
    return child;
  });
}
