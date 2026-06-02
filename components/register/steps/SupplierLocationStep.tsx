import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

// ⚠️  expo-location is required lazily inside functions (not at module top-level)
// because its initialiser calls createPermissionHook which crashes older Expo SDK builds
// when the module is eagerly loaded by the bundler.
let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

interface SupplierLocationStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DEFAULT_REGION = {
  latitude: -1.9441,
  longitude: 30.0619,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SupplierLocationStep({
  data,
  onUpdate,
  onNext,
  onPrev,
}: SupplierLocationStepProps) {
  const [address, setAddress] = useState(
    data.roleSpecific?.location?.address || ''
  );
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(data.roleSpecific?.location?.coords || null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState(
    data.roleSpecific?.location?.coords
      ? {
          latitude: data.roleSpecific.location.coords.latitude,
          longitude: data.roleSpecific.location.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }
      : DEFAULT_REGION
  );

  // Lazy-load expo-location to avoid crashing the module graph at import time
  const getLocation = async () => {
    try {
      const Location = await import('expo-location');
      return Location;
    } catch (e) {
      console.warn('expo-location unavailable:', e);
      return null;
    }
  };

  const detectLocation = async () => {
    setLoading(true);
    try {
      const Location = await getLocation();
      if (!Location) {
        Alert.alert(
          'Unavailable',
          'Location services are not available on this device. Please enter address manually.'
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission was denied. Please enter the address manually.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const currentCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoords(currentCoords);
      setMapRegion({ ...currentCoords, latitudeDelta: 0.012, longitudeDelta: 0.012 });

      const geocode = await Location.reverseGeocodeAsync(currentCoords);
      if (geocode && geocode[0]) {
        const item = geocode[0];
        const addressText = [item.name, item.street, item.city, item.country]
          .filter(Boolean)
          .join(', ');
        setAddress(
          addressText ||
            `Lat: ${currentCoords.latitude.toFixed(4)}, Lon: ${currentCoords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error('Detect location error:', error);
      Alert.alert('Error', 'Could not fetch current location. Please pick on the map or type the address.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (e: any) => {
    if (Platform.OS === 'web') return;
    const pickedCoords = e.nativeEvent.coordinate;
    setCoords(pickedCoords);

    try {
      const Location = await getLocation();
      if (Location) {
        const geocode = await Location.reverseGeocodeAsync(pickedCoords);
        if (geocode && geocode[0]) {
          const item = geocode[0];
          setAddress(
            [item.name, item.street, item.city, item.country].filter(Boolean).join(', ')
          );
        }
      }
    } catch {
      setAddress(
        `Lat: ${pickedCoords.latitude.toFixed(4)}, Lon: ${pickedCoords.longitude.toFixed(4)}`
      );
    }
  };

  const handleContinue = () => {
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your depot or office address.');
      return;
    }

    const finalCoords = coords ?? { latitude: -1.9441, longitude: 30.0619 };

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        location: {
          address: address.trim(),
          coords: finalCoords,
        },
      },
    });

    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={onPrev} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Business Location</Text>
          <Text style={styles.subtitle}>
            Pin your store or warehouse. Clients and engineers will see this for
            pickups and delivery logistics.
          </Text>
        </View>

        {/* Detect Location Button */}
        <Pressable
          style={styles.detectBtn}
          onPress={detectLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="locate-outline" size={20} color="#FFF" />
              <Text style={styles.detectBtnText}>Use My Current Location</Text>
            </>
          )}
        </Pressable>

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Physical Depot / Office Address{' '}
            <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="pin-outline"
              size={18}
              color={COLORS.TEXT_SECONDARY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g., Gikondo Industrial Zone, Kigali"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Map */}
        <Text style={styles.label}>Pick Location on Map</Text>
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' || !MapView ? (
            <View style={styles.mockMap}>
              <Ionicons name="map-outline" size={48} color={COLORS.PRIMARY} />
              <Text style={styles.mockMapText}>
                Interactive map is active on native devices.
              </Text>
              {coords ? (
                <Text style={styles.mockMapCoords}>
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </Text>
              ) : (
                <Text style={styles.mockMapCoords}>
                  Default: Kigali Centre (-1.9441, 30.0619)
                </Text>
              )}
              <Pressable
                style={styles.mockSelectBtn}
                onPress={() => {
                  const sample = {
                    latitude: -1.9441 + (Math.random() - 0.5) * 0.02,
                    longitude: 30.0619 + (Math.random() - 0.5) * 0.02,
                  };
                  setCoords(sample);
                  setAddress('Gikondo Sector, Nyarugenge District, Kigali, Rwanda');
                }}
              >
                <Text style={styles.mockSelectText}>Simulate Placing Pin</Text>
              </Pressable>
            </View>
          ) : (
            <MapView
              style={StyleSheet.absoluteFillObject}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
            >
              {coords && (
                <Marker
                  coordinate={coords}
                  title="Your Business Depot"
                  description={address || 'Material supply warehouse'}
                />
              )}
            </MapView>
          )}
        </View>

        {/* Continue */}
        <Pressable onPress={handleContinue} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    lineHeight: 18,
  },
  detectBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  detectBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  inputContainer: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  required: {
    color: COLORS.ERROR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  mapContainer: {
    height: 220,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    marginBottom: 28,
  },
  mockMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
    backgroundColor: COLORS.MUTED,
  },
  mockMapText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  mockMapCoords: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mockSelectBtn: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  mockSelectText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
