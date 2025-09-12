import React from 'react';
import { View, Text } from 'react-native';
import { kmBetween, siteToCoords } from '../utils/geo';

// Test cases for the geo utility functions
export const geoTests = {
  // Test distance calculation between two known points
  testKmBetween: () => {
    const colombo = { lat: 6.9271, lng: 79.8612 };
    const kandy = { lat: 7.2906, lng: 80.6337 };
    const distance = kmBetween(colombo, kandy);
    
    // Distance between Colombo and Kandy is approximately 116 km
    console.log(`Distance Colombo to Kandy: ${distance.toFixed(2)} km`);
    return distance;
  },

  // Test coordinate conversion
  testSiteToCoords: () => {
    const siteWithLatLng = {
      latitude: 6.9271,
      longitude: 79.8612
    };
    
    const siteWithCoordinates = {
      coordinates: {
        latitude: 7.2906,
        longitude: 80.6337
      }
    };
    
    const invalidSite = {};
    
    console.log('Site with lat/lng:', siteToCoords(siteWithLatLng));
    console.log('Site with coordinates:', siteToCoords(siteWithCoordinates));
    console.log('Invalid site:', siteToCoords(invalidSite));
    
    return {
      valid1: siteToCoords(siteWithLatLng),
      valid2: siteToCoords(siteWithCoordinates),
      invalid: siteToCoords(invalidSite)
    };
  }
};

// Test component to verify no "0" leak
export function TestZeroLeak() {
  const items = [
    { distanceKm: 0, warning: null },
    { distanceKm: 1.5, warning: 'Warning text' },
    { distanceKm: undefined, warning: null }
  ];

  const getWarning = (distance: number) => {
    return distance > 1 ? 'Distance warning' : null;
  };

  return (
    <View>
      <Text>Testing zero leak fixes:</Text>
      {items.map((item, index) => (
        <View key={index}>
          <Text>Item {index + 1}:</Text>
          
          {/* Fixed: No more 0 leak */}
          {item.distanceKm != null && item.distanceKm > 0 && !!getWarning(item.distanceKm) && (
            <Text>Warning: {getWarning(item.distanceKm)}</Text>
          )}
          
          {/* Fixed: Distance badge with proper formatting */}
          {item.distanceKm != null && (
            <Text>Distance: {Number(item.distanceKm).toFixed(1)} km</Text>
          )}
        </View>
      ))}
    </View>
  );
}
