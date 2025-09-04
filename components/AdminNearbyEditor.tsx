import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { databaseService, Site } from '../services/database';
import { kmBetween, siteToCoords } from '../utils/geo';

// BEGIN nearby-admin
export interface NearbyRef {
  id: string;          // site id (foreign key / reference)
  name?: string;       // denormalized label for fast rendering
  distanceKm?: number; // <= 2.0 typically, but not enforced here
  category?: string;   // optional badge
}

export interface AdminNearbyEditorProps {
  value?: NearbyRef[];                      // controlled list
  onChange?: (next: NearbyRef[]) => void;   // controlled update
  onLookupSite?: (q: string) => Promise<Site[]>; // reuse existing admin search API if available
  title: string; // "Within This Site" or "Nearby Attractions"
  maxDistanceKm?: number; // e.g., 2 for Nearby
  testID?: string;
  origin?: { lat: number; lng: number }; // current site being edited (for distance calculation)
  onRecalculateDistances?: (recalc: () => void) => void; // callback for recalculation
}
// END nearby-admin

export function AdminNearbyEditor({ 
  value = [], 
  onChange, 
  onLookupSite,
  title, 
  maxDistanceKm,
  testID,
  origin,
  onRecalculateDistances
}: AdminNearbyEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Site[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ distanceKm: '', category: '' });

  // Recalculate distances effect
  useEffect(() => {
    if (!onRecalculateDistances) return;
    
    const recalc = async () => {
      if (!origin) return;
      
      const next = await Promise.all(
        value.map(async (item) => {
          try {
            // Try to get site details by ID
            const site = await databaseService.getSiteById(parseInt(item.id));
            if (!site) return item;
            
            const siteCoords = siteToCoords(site);
            if (!siteCoords) return item;
            
            const distance = kmBetween(origin, siteCoords);
            return { 
              ...item, 
              distanceKm: Number.isFinite(distance) ? Number(distance.toFixed(2)) : item.distanceKm 
            };
          } catch (error) {
            console.warn('Failed to recalculate distance for site:', item.id, error);
            return item;
          }
        })
      );
      
      onChange?.(next);
    };
    
    onRecalculateDistances(recalc);
  }, [onRecalculateDistances, origin, value, onChange]);

  // BEGIN nearby-admin
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let sites: Site[] = [];
      
      if (onLookupSite) {
        // Use provided lookup function
        sites = await onLookupSite(query);
      } else {
        // Fallback to database search
        sites = await databaseService.searchSites(query);
      }
      
      // Filter out already added sites
      const existingIds = value.map(item => item.id);
      const filteredSites = sites.filter(site => !existingIds.includes(site.id.toString()));
      
      setSearchResults(filteredSites);
    } catch (error) {
      console.error('Error searching sites:', error);
      Alert.alert('Error', 'Failed to search sites. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSite = (site: Site) => {
    // Calculate distance if we have origin and site coordinates
    const siteCoords = siteToCoords(site);
    const computed = origin && siteCoords 
      ? kmBetween(origin, siteCoords)
      : 0;
    
    const newItem: NearbyRef = {
      id: site.id.toString(),
      name: site.name,
      distanceKm: Number.isFinite(computed) ? Number(computed.toFixed(2)) : 0,
      category: site.category || ''
    };
    
    const updatedList = [...value, newItem];
    onChange?.(updatedList);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveItem = (index: number) => {
    const updatedList = value.filter((_, i) => i !== index);
    onChange?.(updatedList);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedList = [...value];
    [updatedList[index - 1], updatedList[index]] = [updatedList[index], updatedList[index - 1]];
    onChange?.(updatedList);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const updatedList = [...value];
    [updatedList[index], updatedList[index + 1]] = [updatedList[index + 1], updatedList[index]];
    onChange?.(updatedList);
  };

  const handleStartEdit = (index: number) => {
    const item = value[index];
    setEditingIndex(index);
    setEditForm({
      distanceKm: item.distanceKm?.toString() || '',
      category: item.category || ''
    });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const distanceKm = parseFloat(editForm.distanceKm);
    if (isNaN(distanceKm) || distanceKm < 0) {
      Alert.alert('Invalid Distance', 'Distance must be a positive number');
      return;
    }
    
    const updatedList = [...value];
    updatedList[editingIndex] = {
      ...updatedList[editingIndex],
      distanceKm,
      category: editForm.category.trim()
    };
    
    onChange?.(updatedList);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const getDistanceWarning = (distance: number): string | null => {
    if (maxDistanceKm && distance > maxDistanceKm) {
      return `⚠️ Distance exceeds ${maxDistanceKm} km recommendation`;
    }
    return null;
  };
  // END nearby-admin

  return (
    <View testID={testID}>
      <Card style={styles.container}>
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          <Badge variant="secondary" style={styles.countBadge}>
            {value.length}
          </Badge>
        </View>
        <Text style={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <CardContent style={styles.content}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Label style={styles.sectionLabel}>Add New Item</Label>
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search heritage sites..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                style={styles.searchInput}
              />
              {isSearching && (
                <Text style={styles.searchingText}>🔍 Searching...</Text>
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} nestedScrollEnabled>
                {searchResults.map((site) => (
                  <TouchableOpacity
                    key={site.id}
                    style={styles.searchResultItem}
                    onPress={() => handleAddSite(site)}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>{site.name}</Text>
                      <Text style={styles.searchResultDetails}>
                        {`${site.location || 'Unknown'} • ${site.category || 'Uncategorized'}`}
                      </Text>
                    </View>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Current Items List */}
          <View style={styles.itemsSection}>
            <Label style={styles.sectionLabel}>
              Current Items ({value.length})
            </Label>
            
            {value.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No items added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Search and add heritage sites above
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {value.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.item}>
                    {editingIndex === index ? (
                      // Edit Mode
                      <View style={styles.editMode}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        
                        <View style={styles.editForm}>
                          <View style={styles.editField}>
                            <Label style={styles.editLabel}>Distance (km)</Label>
                            <TextInput
                              value={editForm.distanceKm}
                              onChangeText={(text) => setEditForm(prev => ({ ...prev, distanceKm: text }))}
                              placeholder="0.0"
                              keyboardType="numeric"
                              style={styles.editInput}
                            />
                          </View>
                          
                          <View style={styles.editField}>
                            <Label style={styles.editLabel}>Category</Label>
                            <TextInput
                              value={editForm.category}
                              onChangeText={(text) => setEditForm(prev => ({ ...prev, category: text }))}
                              placeholder="Optional category"
                              style={styles.editInput}
                            />
                          </View>
                        </View>

                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveEdit}
                          >
                            <Text style={styles.saveButtonText}>✓ Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelEdit}
                          >
                            <Text style={styles.cancelButtonText}>✕ Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      // Display Mode
                      <View style={styles.displayMode}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <View style={styles.itemActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <Text style={[
                                styles.actionButtonText,
                                index === 0 && styles.actionButtonDisabled
                              ]}>↑</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleMoveDown(index)}
                              disabled={index === value.length - 1}
                            >
                              <Text style={[
                                styles.actionButtonText,
                                index === value.length - 1 && styles.actionButtonDisabled
                              ]}>↓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleStartEdit(index)}
                            >
                              <Text style={styles.actionButtonText}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleRemoveItem(index)}
                            >
                              <Text style={styles.removeButtonText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.itemDetails}>
                          {item.distanceKm != null && (
                            <Badge variant="outline" style={styles.distanceBadge}>
                              {`${Number(item.distanceKm).toFixed(1)} km`}
                            </Badge>
                          )}
                          {item.category && (
                            <Badge variant="secondary" style={styles.categoryBadge}>
                              {item.category}
                            </Badge>
                          )}
                        </View>

                        {item.distanceKm != null && item.distanceKm > 0 && !!getDistanceWarning(item.distanceKm) && (
                          <Text style={styles.warningText}>
                            {getDistanceWarning(item.distanceKm)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </CardContent>
        )}
      </Card>
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  searchingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  searchResults: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchResultDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addIcon: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  itemsSection: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  itemsList: {
    gap: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  displayMode: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  actionButtonDisabled: {
    color: '#D1D5DB',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  distanceBadge: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    color: '#1D4ED8',
  },
  categoryBadge: {
    backgroundColor: '#F3E8FF',
    color: '#7C3AED',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editMode: {
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  editForm: {
    marginVertical: 12,
    gap: 12,
  },
  editField: {
    gap: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
