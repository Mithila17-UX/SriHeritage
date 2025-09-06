import React from 'react';
import { Text } from 'react-native';
import { wrapTextChildren } from '../components/ui/text-wrapper';

// Simple test to verify that our text wrapping function works correctly
// This ensures that raw text strings are properly wrapped in Text components

// Test 1: Raw string should be wrapped in Text
const rawStringTest = wrapTextChildren('This is a raw string');
console.log('Raw string test:', rawStringTest);

// Test 2: Number should be wrapped in Text
const numberTest = wrapTextChildren(42);
console.log('Number test:', numberTest);

// Test 3: Already wrapped text should remain unchanged
const alreadyWrappedTest = wrapTextChildren(<Text>Already wrapped</Text>);
console.log('Already wrapped test:', alreadyWrappedTest);

// Test 4: Mixed content (array of elements)
const mixedContentTest = wrapTextChildren([
  'Raw text',
  <Text key="wrapped">Wrapped text</Text>,
  123
]);
console.log('Mixed content test:', mixedContentTest);

export {
  rawStringTest,
  numberTest,
  alreadyWrappedTest,
  mixedContentTest
};
