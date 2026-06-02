// app/(client)/create-project/steps/Step3_Location.tsx
/**
 * @fileoverview Step 3: Site location with GPS boundary drawing
 * Uses react-native-maps for interactive polygon drawing
 * Requires Google Maps API key
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '@/constants/colors';
import { ProjectData } from '..';

const { width, height } = Dimensions.get('window');

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Step3Props {
  data: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3_Location({ data, onUpdate, onNext, onPrev }: Step3Props) {
  const [coordinates, setCoordinates] = useState<Coordinate[]>(data.location.coordinates);
  const [isDrawing, setIsDrawing] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to mark your project site');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setCurrentLocation(region);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  // Handle map press to add points
  const handleMapPress = (event: any) => {
    if (!isDrawing) return;
    
    const { coordinate } = event.nativeEvent;
    setCoordinates([...coordinates, coordinate]);
  };

  // Remove last point
  const handleUndo = () => {
    if (coordinates.length > 0) {
      setCoordinates(coordinates.slice(0, -1));
    }
  };

  // Clear all points
  const handleClear = () => {
    Alert.alert(
      'Clear Boundary',
      'Are you sure you want to clear all points?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setCoordinates([])
        },
      ]
    );
  };

  // Complete polygon drawing
  const handleComplete = () => {
    if (coordinates.length < 3) {
      Alert.alert('Invalid Boundary', 'Please add at least 3 points to create a polygon');
      return;
    }
    
    const area = calculateArea(coordinates);
    setIsDrawing(false);
    
    onUpdate({
      location: {
        coordinates,
        area,
      },
    });
  };

  // Calculate area of polygon in square meters
  const calculateArea = (coords: Coordinate[]): number => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].latitude * coords[j].longitude;
      area -= coords[j].latitude * coords[i].longitude;
    }
    area = Math.abs(area) / 2;
    
    // Convert to square meters (approximate)
    const metersPerDegree = 111319.9;
    return area * metersPerDegree * metersPerDegree;
  };

  // Edit existing boundary
  const handleEdit = () => {
    setIsDrawing(true);
  };

  const area = calculateArea(coordinates);
  const isPolygonValid = coordinates.length >= 3;

  const handlePrev = () => {
    onUpdate({
      location: {
        coordinates,
        area,
      },
    });
    onPrev();
  };

  const handleNext = () => {
    if (!isPolygonValid) {
      Alert.alert('Missing Location', 'Please draw the site boundary on the map');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={currentLocation || {
          latitude: -1.9441,
          longitude: 30.0619,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Render markers for each point */}
        {coordinates.map((coord, index) => (
          <Marker
            key={index}
            coordinate={coord}
            title={`Point ${index + 1}`}
            pinColor={COLORS.PRIMARY}
          />
        ))}
        
        {/* Render polygon if we have points */}
        {coordinates.length >= 3 && (
          <Polygon
            coordinates={coordinates}
            strokeColor={COLORS.PRIMARY}
            fillColor="rgba(4, 120, 87, 0.3)"
            strokeWidth={2}
          />
        )}
      </MapView>
      
      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <View style={styles.drawingBadge}>
          <Ionicons name="create-outline" size={16} color="#FFF" />
          <Text style={styles.drawingBadgeText}>Drawing Mode</Text>
        </View>
      )}
      
      {/* Controls Panel */}
      <View style={styles.controlsPanel}>
        <View style={styles.infoRow}>
          <View style={styles.pointInfo}>
            <Ionicons name="location-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.infoText}>
              {coordinates.length} / Minimum 3 points
            </Text>
          </View>
          {isPolygonValid && (
            <View style={styles.areaInfo}>
              <Ionicons name="resize-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.infoText}>
                {(area / 10000).toFixed(2)} hectares
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonRow}>
          {isDrawing ? (
            <>
              <Pressable onPress={handleClear} style={[styles.button, styles.clearButton]}>
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Clear</Text>
              </Pressable>
              
              {coordinates.length > 0 && (
                <Pressable onPress={handleUndo} style={[styles.button, styles.undoButton]}>
                  <Ionicons name="arrow-undo-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Undo</Text>
                </Pressable>
              )}
              
              <Pressable
                onPress={handleComplete}
                disabled={!isPolygonValid}
                style={[
                  styles.button,
                  styles.completeButton,
                  !isPolygonValid && styles.disabledButton,
                ]}
              >
                <Ionicons name="checkmark-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={handleEdit} style={[styles.button, styles.editButton]}>
                <Ionicons name="create-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Edit Boundary</Text>
              </Pressable>
              
              <Pressable onPress={handleClear} style={[styles.button, styles.clearButton]}>
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Reset</Text>
              </Pressable>
            </>
          )}
        </View>
        
        <Text style={styles.instruction}>
          {isDrawing 
            ? "📍 Tap on the map to add boundary points. Create a polygon around your property."
            : "✓ Site boundary saved. Tap 'Edit Boundary' to make changes."}
        </Text>
      </View>
      
      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        <Pressable onPress={handlePrev} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        
        <Pressable
          onPress={handleNext}
          style={[
            styles.nextButton,
            !isPolygonValid && styles.disabledButton,
          ]}
          disabled={!isPolygonValid}
        >
          <Text style={styles.nextButtonText}>Continue to Documents</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  map: {
    width: width,
    height: height * 0.5,
  },
  drawingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  drawingBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsPanel: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  pointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  areaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearButton: {
    backgroundColor: COLORS.ERROR,
  },
  undoButton: {
    backgroundColor: COLORS.WARNING,
  },
  completeButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instruction: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    marginTop: 8,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginTop: 0,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  backButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});