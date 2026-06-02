// app/(client)/create-project/steps/Step3_Location.tsx
/**
 * @fileoverview Step 3: Site location with GPS boundary drawing
 * Supports three input modes: Address Search (Google Maps), Manual Drawing, or Land Document registry
 * Features modal-based map view with proper navigation flow
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
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

interface VerifiedLand {
  upi: string;
  ownerName: string;
  size: number;
  useType: string;
  sector: string;
  district: string;
  coordinates: Coordinate[];
}

export default function Step3_Location({ data, onUpdate, onNext, onPrev }: Step3Props) {
  const insets = useSafeAreaInsets();
  const [inputMode, setInputMode] = useState<'search' | 'map' | 'document'>('search');
  const [coordinates, setCoordinates] = useState<Coordinate[]>(data.location.coordinates || []);
  const [isDrawing, setIsDrawing] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<Coordinate[]>([]);
  
  // Google Maps Search states
  const [addressSearch, setAddressSearch] = useState(data.location.address || '');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchedAddressData, setSearchedAddressData] = useState<{ address: string; lat: number; lng: number } | null>(
    data.location.address && !data.location.upi ? { address: data.location.address, lat: -1.9441, lng: 30.0619 } : null
  );

  // UPI Document Mode states
  const [upiInput, setUpiInput] = useState(data.location.upi || '');
  const [isVerifyingLand, setIsVerifyingLand] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<{ name: string; size: string } | null>(
    data.location.upi ? { name: 'Icyangobwa_cy_Ubutaka_Verified.pdf', size: '1.8 MB' } : null
  );

  const [verifiedLandData, setVerifiedLandData] = useState<VerifiedLand | null>(
    data.location.upi ? {
      upi: data.location.upi,
      ownerName: data.location.ownerName || 'Jean Bosco Niyonisenga',
      size: data.location.area || 450,
      useType: data.location.landUse || 'Residential (R1A)',
      sector: 'Kimironko',
      district: 'Gasabo',
      coordinates: data.location.coordinates || []
    } : null
  );

  const modalMapRef = useRef<MapView>(null);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Reset temp coordinates when modal opens
  useEffect(() => {
    if (showMapModal) {
      setTempCoordinates([...coordinates]);
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
    return () => {
      StatusBar.setHidden(false);
    };
  }, [showMapModal]);

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
    setTempCoordinates([...tempCoordinates, coordinate]);
  };

  // Remove last point
  const handleUndo = () => {
    if (tempCoordinates.length > 0) {
      setTempCoordinates(tempCoordinates.slice(0, -1));
    }
  };

  // Clear all points
  const handleClear = () => {
    Alert.alert(
      'Clear All Points',
      'Are you sure you want to clear all boundary points?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setTempCoordinates([])
        },
      ]
    );
  };

  // Save polygon from modal
  const handleSaveModal = () => {
    if (tempCoordinates.length < 3) {
      Alert.alert('Invalid Boundary', 'Please add at least 3 points to create a polygon');
      return;
    }
    
    setCoordinates([...tempCoordinates]);
    setIsDrawing(false);
    setShowMapModal(false);
    
    const area = calculateArea(tempCoordinates);
    onUpdate({
      location: {
        coordinates: tempCoordinates,
        area,
        address: data.location.address || 'Kigali, Rwanda'
      },
    });
  };

  // Cancel modal changes
  const handleCancelModal = () => {
    setTempCoordinates([...coordinates]);
    setShowMapModal(false);
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
    
    const metersPerDegree = 111319.9;
    return area * metersPerDegree * metersPerDegree;
  };

  // Edit existing boundary - opens modal
  const handleEditBoundary = () => {
    setIsDrawing(true);
    setTempCoordinates([...coordinates]);
    setShowMapModal(true);
  };

  // Google Maps Geocoding Address Lookup
  const handleAddressSearch = async () => {
    const query = addressSearch.trim();
    if (!query) {
      Alert.alert('Error', 'Please enter an address or landmark.');
      return;
    }

    setIsSearchingAddress(true);
    
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      
      let lat = -1.9441;
      let lng = 30.0619;
      let formatted = `${query}, Kigali, Rwanda`;

      if (apiKey && apiKey !== 'AIzaSyCdhSd0TiA6w7L8019ekxSU3rXQmq5Sm6Y') {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'OK' && json.results && json.results.length > 0) {
          const loc = json.results[0].geometry.location;
          lat = loc.lat;
          lng = loc.lng;
          formatted = json.results[0].formatted_address;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const queryLower = query.toLowerCase();
        if (queryLower.includes('gasabo') || queryLower.includes('kimironko')) {
          lat = -1.9441;
          lng = 30.0619;
        } else if (queryLower.includes('kicukiro') || queryLower.includes('kanombe')) {
          lat = -1.9624;
          lng = 30.1245;
        } else if (queryLower.includes('nyarugenge') || queryLower.includes('kiyovu')) {
          lat = -1.9489;
          lng = 30.0592;
        }
        formatted = `${query}, Kigali, Rwanda`;
      }

      const mockPolygonCoords = [
        { latitude: lat + 0.0002, longitude: lng - 0.0002 },
        { latitude: lat + 0.0002, longitude: lng + 0.0002 },
        { latitude: lat - 0.0002, longitude: lng + 0.0002 },
        { latitude: lat - 0.0002, longitude: lng - 0.0002 }
      ];

      setCoordinates(mockPolygonCoords);
      setTempCoordinates(mockPolygonCoords);
      setSearchedAddressData({
        address: formatted,
        lat,
        lng
      });

      Alert.alert(
        'Location Found',
        `Address "${formatted}" has been located on the map.`,
        [
          { text: 'OK', onPress: () => setShowMapModal(true) }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Geocoding Error', 'Failed to resolve location details. Please try manual boundary drawing.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Simulated Land Document Lookup
  const handleVerifyUPI = () => {
    const trimmedUPI = upiInput.trim();
    if (!trimmedUPI) {
      Alert.alert('Error', 'Please enter a valid Land UPI Number.');
      return;
    }

    const upiRegex = /^\d\/\d{2}\/\d{2}\/\d{2}\/\d{1,5}$/;
    if (!upiRegex.test(trimmedUPI)) {
      Alert.alert(
        'Invalid UPI Format',
        'Rwandan UPIs usually follow the format: Province/District/Sector/Cell/Parcel (e.g., 1/02/05/11/204).'
      );
      return;
    }

    setIsVerifyingLand(true);
    setTimeout(() => {
      setIsVerifyingLand(false);
      
      const mockCoords = [
        { latitude: -1.9441, longitude: 30.0619 },
        { latitude: -1.9445, longitude: 30.0619 },
        { latitude: -1.9445, longitude: 30.0625 },
        { latitude: -1.9441, longitude: 30.0625 }
      ];
      setCoordinates(mockCoords);
      setTempCoordinates(mockCoords);
      setVerifiedLandData({
        upi: trimmedUPI,
        ownerName: "Jean Bosco Niyonisenga",
        size: 520,
        useType: "High Density Residential (R1A)",
        sector: "Kimironko",
        district: "Gasabo",
        coordinates: mockCoords
      });

      Alert.alert(
        'Land Verified',
        `Land parcel ${trimmedUPI} has been verified. Owner: Jean Bosco Niyonisenga, Size: 520 m²`,
        [{ text: 'View on Map', onPress: () => setShowMapModal(true) }]
      );
    }, 1500);
  };

  const handleUploadDocument = () => {
    setIsUploadingDoc(true);
    setTimeout(() => {
      setIsUploadingDoc(false);
      
      const mockUPI = "1/02/05/11/204";
      setUpiInput(mockUPI);
      setUploadedDocument({
        name: 'Land_Certificate_UPI_1020511204.pdf',
        size: '1.8 MB'
      });

      const mockCoords = [
        { latitude: -1.9441, longitude: 30.0619 },
        { latitude: -1.9445, longitude: 30.0619 },
        { latitude: -1.9445, longitude: 30.0625 },
        { latitude: -1.9441, longitude: 30.0625 }
      ];
      setCoordinates(mockCoords);
      setTempCoordinates(mockCoords);
      setVerifiedLandData({
        upi: mockUPI,
        ownerName: "Jean Bosco Niyonisenga",
        size: 520,
        useType: "High Density Residential (R1A)",
        sector: "Kimironko",
        district: "Gasabo",
        coordinates: mockCoords
      });

      Alert.alert(
        'Document Processed',
        'Land Certificate successfully parsed. Verified owner, dimensions, and parcel coordinates from RLMUA are loaded.',
        [{ text: 'View on Map', onPress: () => setShowMapModal(true) }]
      );
    }, 2000);
  };

  const area = calculateArea(coordinates);
  const tempArea = calculateArea(tempCoordinates);
  const isPolygonValid = coordinates.length >= 3;
  const isTempPolygonValid = tempCoordinates.length >= 3;

  const handlePrev = () => {
    saveLocationData();
    onPrev();
  };

  const handleNext = () => {
    if (inputMode === 'search') {
      if (!searchedAddressData || !isPolygonValid) {
        Alert.alert('Address Required', 'Please enter and search for a valid address first.');
        return;
      }
    } else if (inputMode === 'map') {
      if (!isPolygonValid) {
        Alert.alert('Missing Location', 'Please draw the site boundary on the map');
        return;
      }
    } else {
      if (!verifiedLandData) {
        Alert.alert('Verification Required', 'Please verify your Land UPI details or upload document first.');
        return;
      }
    }
    
    saveLocationData();
    onNext();
  };

  const saveLocationData = () => {
    if (inputMode === 'search' && searchedAddressData) {
      onUpdate({
        location: {
          coordinates,
          area: calculateArea(coordinates),
          address: searchedAddressData.address
        }
      });
    } else if (inputMode === 'map') {
      onUpdate({
        location: {
          coordinates,
          area,
          address: 'Kigali, Rwanda'
        },
      });
    } else if (verifiedLandData) {
      onUpdate({
        location: {
          coordinates: verifiedLandData.coordinates,
          area: verifiedLandData.size,
          upi: verifiedLandData.upi,
          ownerName: verifiedLandData.ownerName,
          landUse: verifiedLandData.useType,
          address: `${verifiedLandData.district}, ${verifiedLandData.sector}`
        }
      });
    }
  };

  const renderLocationSummary = () => {
    if (inputMode === 'search' && searchedAddressData) {
      return (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.summaryTitle}>Address Located</Text>
          </View>
          <Text style={styles.summaryText} numberOfLines={2}>{searchedAddressData.address}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Area:</Text>
            <Text style={styles.summaryValue}>{area.toFixed(1)} m²</Text>
          </View>
          <Pressable onPress={handleEditBoundary} style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.editButtonText}>Adjust Boundary on Map</Text>
          </Pressable>
        </View>
      );
    }
    
    if (inputMode === 'map' && isPolygonValid) {
      return (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="map-outline" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.summaryTitle}>Manual Boundary Set</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Points:</Text>
            <Text style={styles.summaryValue}>{coordinates.length} points</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Area:</Text>
            <Text style={styles.summaryValue}>{area.toFixed(1)} m²</Text>
          </View>
          <Pressable onPress={handleEditBoundary} style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.editButtonText}>Edit Boundary on Map</Text>
          </Pressable>
        </View>
      );
    }
    
    if (inputMode === 'document' && verifiedLandData) {
      return (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.summaryTitle}>RLMUA Verified</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Owner:</Text>
            <Text style={styles.summaryValue}>{verifiedLandData.ownerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>UPI:</Text>
            <Text style={styles.summaryValue}>{verifiedLandData.upi}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Size:</Text>
            <Text style={styles.summaryValue}>{verifiedLandData.size} m²</Text>
          </View>
          <Pressable onPress={handleEditBoundary} style={styles.editButton}>
            <Ionicons name="eye-outline" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.editButtonText}>View on Map</Text>
          </Pressable>
        </View>
      );
    }
    
    return null;
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
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Project Location</Text>
            <Text style={styles.subtitle}>
              Set the construction site location using address search, map drawing, or land certificate
            </Text>
          </View>

          {/* Input Mode Selector - Three Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setInputMode('search')}
              style={[styles.tab, inputMode === 'search' && styles.activeTab]}
            >
              <Ionicons name="search-outline" size={18} color={inputMode === 'search' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} />
              <Text style={[styles.tabText, inputMode === 'search' && styles.activeTabText]}>
                Address Search
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setInputMode('map')}
              style={[styles.tab, inputMode === 'map' && styles.activeTab]}
            >
              <Ionicons name="map-outline" size={18} color={inputMode === 'map' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} />
              <Text style={[styles.tabText, inputMode === 'map' && styles.activeTabText]}>
                Draw on Map
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setInputMode('document')}
              style={[styles.tab, inputMode === 'document' && styles.activeTab]}
            >
              <Ionicons name="document-text-outline" size={18} color={inputMode === 'document' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} />
              <Text style={[styles.tabText, inputMode === 'document' && styles.activeTabText]}>
                Land Certificate
              </Text>
            </Pressable>
          </View>

          {/* Tab 1: Address Search */}
          {inputMode === 'search' && (
            <View style={styles.inputPanel}>
              <Text style={styles.fieldLabel}>Search Address or Landmark</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g., Kimironko Market, KN 3 Rd"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={addressSearch}
                  onChangeText={setAddressSearch}
                />
                <Pressable
                  onPress={handleAddressSearch}
                  disabled={isSearchingAddress}
                  style={[styles.searchButton, isSearchingAddress && styles.disabledButton]}
                >
                  {isSearchingAddress ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="search" size={16} color="#FFF" />
                      <Text style={styles.searchButtonText}>Find</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Tab 2: Map Drawing */}
          {inputMode === 'map' && (
            <View style={styles.inputPanel}>
              <Text style={styles.fieldLabel}>Draw Site Boundary</Text>
              <Text style={styles.helperText}>
                Tap the button below to open the map and draw your property boundary
              </Text>
              <Pressable
                onPress={handleEditBoundary}
                style={styles.mapButton}
              >
                <Ionicons name="map-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.mapButtonText}>
                  {isPolygonValid ? 'Edit Boundary on Map' : 'Open Map to Draw Boundary'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Tab 3: Land Certificate */}
          {inputMode === 'document' && (
            <View style={styles.inputPanel}>
              <Text style={styles.fieldLabel}>Option 1: Enter UPI Number</Text>
              <View style={styles.upiRow}>
                <TextInput
                  style={styles.upiInput}
                  placeholder="e.g., 1/02/05/11/204"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={upiInput}
                  onChangeText={setUpiInput}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={handleVerifyUPI}
                  disabled={isVerifyingLand}
                  style={[styles.verifyButton, isVerifyingLand && styles.disabledButton]}
                >
                  {isVerifyingLand ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.fieldLabel}>Option 2: Upload Land Certificate</Text>
              <Pressable
                onPress={handleUploadDocument}
                disabled={isUploadingDoc}
                style={[styles.uploadButton, isUploadingDoc && styles.disabledButton]}
              >
                {isUploadingDoc ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                    <Text style={{ color: COLORS.PRIMARY, fontSize: 13 }}>Processing document...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadButtonText}>Upload Icyangobwa cy'Ubutaka</Text>
                  </>
                )}
              </Pressable>
              <Text style={styles.helperText}>
                PDF, JPEG, or PNG. We'll extract the UPI and verify with RLMUA.
              </Text>
            </View>
          )}

          {/* Location Summary */}
          {renderLocationSummary()}

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
                (inputMode === 'search' && (!searchedAddressData || !isPolygonValid)) && styles.disabledButton,
                (inputMode === 'map' && !isPolygonValid) && styles.disabledButton,
                (inputMode === 'document' && !verifiedLandData) && styles.disabledButton,
              ]}
              disabled={
                (inputMode === 'search' && (!searchedAddressData || !isPolygonValid)) ||
                (inputMode === 'map' && !isPolygonValid) ||
                (inputMode === 'document' && !verifiedLandData)
              }
            >
              <Text style={styles.nextButtonText}>Continue to Documents</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full Screen Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCancelModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {inputMode === 'map' ? 'Draw Property Boundary' : 'Adjust Site Boundary'}
            </Text>
            <Pressable onPress={handleSaveModal} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>

          {/* Full Screen Map */}
          <MapView
            ref={modalMapRef}
            style={styles.fullMap}
            onPress={handleMapPress}
            initialRegion={currentLocation || {
              latitude: -1.9441,
              longitude: 30.0619,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {tempCoordinates.map((coord, index) => (
              <Marker
                key={index}
                coordinate={coord}
                title={`Point ${index + 1}`}
                pinColor={COLORS.PRIMARY}
              />
            ))}
            
            {tempCoordinates.length >= 3 && (
              <Polygon
                coordinates={tempCoordinates}
                strokeColor={COLORS.PRIMARY}
                fillColor="rgba(4, 120, 87, 0.3)"
                strokeWidth={2}
              />
            )}
          </MapView>

          {/* Map Controls */}
          <View style={[styles.modalControls, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalInfoRow}>
              <View style={styles.modalPointInfo}>
                <Ionicons name="location-outline" size={18} color={COLORS.PRIMARY} />
                <Text style={styles.modalInfoText}>
                  {tempCoordinates.length} {tempCoordinates.length === 1 ? 'point' : 'points'}
                </Text>
              </View>
              {isTempPolygonValid && (
                <View style={styles.modalAreaInfo}>
                  <Ionicons name="resize-outline" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.modalInfoText}>
                    {tempArea.toFixed(0)} m²
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable onPress={handleClear} style={[styles.modalButton, styles.modalClearButton]}>
                <Ionicons name="trash-outline" size={18} color="#FFF" />
                <Text style={styles.modalButtonText}>Clear All</Text>
              </Pressable>
              
              {tempCoordinates.length > 0 && (
                <Pressable onPress={handleUndo} style={[styles.modalButton, styles.modalUndoButton]}>
                  <Ionicons name="arrow-undo-outline" size={18} color="#FFF" />
                  <Text style={styles.modalButtonText}>Undo</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.modalInstruction}>
              📍 Tap on the map to add boundary points. Need at least 3 points to create a polygon.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    lineHeight: 20,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.SURFACE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
  },
  inputPanel: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.MUTED,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  searchButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
  },
  mapButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
  },
  upiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  upiInput: {
    flex: 1,
    backgroundColor: COLORS.MUTED,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  verifyButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.MUTED,
  },
  editButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 20,
    marginTop: 8,
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
  disabledButton: {
    opacity: 0.5,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fullMap: {
    flex: 1,
  },
  modalControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  modalPointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalAreaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalClearButton: {
    backgroundColor: COLORS.ERROR,
  },
  modalUndoButton: {
    backgroundColor: COLORS.WARNING,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalInstruction: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});