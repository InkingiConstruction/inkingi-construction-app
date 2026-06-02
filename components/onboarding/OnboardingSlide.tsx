// /components/onboarding/OnboardingSlide.tsx
/**
 * @fileoverview Individual onboarding slide component
 * Displays a single slide with icon, title, description
 * All text is white for visibility on dark background overlay
 * 
 * @responsibility
 * - Render slide content with consistent styling
 * - Display icon with background effects
 * - Support animations for slide transitions
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface SlideData {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
}

interface OnboardingSlideProps {
  slide: SlideData;
  isActive: boolean;
}

export default function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
  return (
    <View style={{ width, paddingHorizontal: 24 }}>
      {/* Label Badge - White text */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: 12, 
          fontWeight: '800',
          letterSpacing: 1,
        }}>
          {slide.label}
        </Text>
      </View>

      {/* Icon with decorative elements - Keep original colors for icons */}
      <View style={{ height: 290, justifyContent: 'center', marginBottom: 24 }}>
        {/* Decorative background shapes - slightly transparent */}
        <View
          style={{
            backgroundColor: 'rgba(139, 205, 193, 0.3)',
            height: 78,
            position: 'absolute',
            right: -12,
            top: 82,
            transform: [{ rotate: '-10deg' }],
            width: '86%',
            borderRadius: 20,
          }}
        />
        <View
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.3)',
            bottom: 42,
            height: 76,
            left: 22,
            position: 'absolute',
            transform: [{ rotate: '-10deg' }],
            width: '84%',
            borderRadius: 20,
          }}
        />
        
        {/* Main Icon Circle - Keep original colors but with slight transparency */}
        <View
          style={{
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: slide.backgroundColor ? `${slide.backgroundColor}CC` : 'rgba(255, 255, 255, 0.95)',
            borderRadius: 70,
            height: 140,
            justifyContent: 'center',
            width: 140,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons 
            name={slide.icon} 
            size={74} 
            color={slide.iconColor || '#065F46'} 
          />
        </View>
      </View>

      {/* Content - All white text */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontWeight: '900',
            lineHeight: 40,
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }}
        >
          {slide.title}
        </Text>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: 16,
            lineHeight: 24,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {slide.description}
        </Text>
      </View>
    </View>
  );
}