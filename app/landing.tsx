// /app/landing.tsx
/**
 * @fileoverview Landing page shown after onboarding completion
 * Features hero banner with background image, call-to-action buttons
 * 
 * @responsibility
 * - Display beautiful hero section with construction-themed imagery
 * - Provide clear CTAs for login and registration
 * - Show platform features
 * - Handle navigation to auth screens
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: 'people-outline',
    title: 'Verified Professionals',
    description: 'All engineers, supervisors, and suppliers are vetted',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Secure Escrow',
    description: 'Payments protected until milestone completion',
  },
  {
    icon: 'trending-up-outline',
    title: 'Project Tracking',
    description: 'Real-time progress updates and document sharing',
  },
];

export default function LandingScreen() {
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {/* Hero Section with Background Image */}
      <ImageBackground
        source={require('../assets/inkingi-banner.jpg')}
        style={{ 
          width: width, 
          minHeight: height * 0.85,
        }}
        resizeMode="cover"
      >
        {/* Overlay with opacity */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.96)',
          }}
        />
        
        <SafeAreaView style={{ flex: 1 }}>
          <View 
            style={{
              flex: 1,
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingTop: Platform.OS === 'ios' ? 40 : 60,
              paddingBottom: 40,
            }}
          >
            {/* Logo and Tagline */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Ionicons name="construct" size={48} color="#FFF" />
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: '#FFF',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                InkingiPro
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                }}
              >
                Build with Trust • Secure Payments
              </Text>
            </View>

            {/* CTA Buttons */}
            <View style={{ gap: 16, marginBottom: 32 }}>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => ({
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 14,
                  paddingVertical: 18,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                })}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>
                  Login to Your Account
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(auth)/register')}
                style={({ pressed }) => ({
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 14,
                  paddingVertical: 18,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  borderWidth: 1,
                  borderColor: COLORS.PRIMARY,
                })}
              >
                <Text style={{ color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 18 }}>
                  Create New Account
                </Text>
              </Pressable>
            </View>

            {/* Feature List */}
            <View style={{ gap: 12 }}>
              {FEATURES.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={feature.icon} size={22} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {feature.title}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </ScrollView>
  );
}