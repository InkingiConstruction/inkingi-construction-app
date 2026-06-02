// /components/onboarding/OnboardingScreen.tsx
/**
 * @fileoverview Main onboarding screen with swipe animations
 * Features background image overlay, smooth transitions, and CTA button on last slide
 * 
 * @responsibility
 * - Handle swipe gestures between slides
 * - Animate slide transitions
 * - Show Get Started button on last slide
 * - Call onComplete when onboarding finishes
 * 
 * @principle KISS - Clean separation of concerns
 * @principle DRY - Reusable slide rendering
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OnboardingSlide, { SlideData } from './OnboardingSlide';
import OnboardingPagination from './OnboardingPagination';
import { COLORS } from '@/constants/colors';

const { width } = Dimensions.get('window');

// Onboarding slides data - all text will be white
const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: '1',
    label: 'PROJECT CONTROL',
    title: 'Build with verified engineers, supervisors, and suppliers.',
    description: 'Create a project, assign the right team, track milestones, and keep every decision visible from your phone.',
    icon: 'business-outline',
    iconColor: '#065F46',
    backgroundColor: '#D1FAE5',
  },
  {
    id: '2',
    label: 'MILESTONES & BOQ',
    title: 'Turn site work into clear milestones and material requests.',
    description: 'Engineers prepare BOQs, publish RFQs, compare supplier quotes, and upload real progress from the field.',
    icon: 'construct-outline',
    iconColor: '#1E40AF',
    backgroundColor: '#DBEAFE',
  },
  {
    id: '3',
    label: 'ESCROW & DELIVERY',
    title: 'Release payments after proof, inspection, and delivery.',
    description: 'Supervisors approve progress, clients release milestone payments, and suppliers manage purchase orders.',
    icon: 'shield-checkmark-outline',
    iconColor: '#B45309',
    backgroundColor: '#FEF3C7',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  // Handle next button press
  const handleNext = () => {
    if (isLastSlide) {
      // Mark onboarding as completed and navigate
      onComplete();
    } else {
      // Scroll to next slide
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    }
  };

  // Handle skip button press
  const handleSkip = () => {
    onComplete();
  };

  // Handle scroll event to update active index
  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Render single slide
  const renderSlide = ({ item }: { item: SlideData }) => (
    <OnboardingSlide slide={item} isActive={item.id === ONBOARDING_SLIDES[activeIndex]?.id} />
  );

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/inkingi-banner.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        {/* Base dark overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          }}
        />
        
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={{ flex: 1 }}>
            {/* Header with skip button */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingTop: Platform.OS === 'ios' ? 8 : 16,
              }}
            >
              {/* Decorative element - made white for better visibility */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderBottomRightRadius: 18,
                  borderTopRightRadius: 18,
                  height: 28,
                  width: 16,
                }}
              />
              {!isLastSlide && (
                <Pressable onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14, opacity: 0.9 }}>
                    Skip
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Slides - Text colors will be white via OnboardingSlide component */}
            <FlatList
              ref={flatListRef}
              data={ONBOARDING_SLIDES}
              renderItem={renderSlide}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ alignItems: 'center' }}
            />

            {/* Footer with pagination and buttons */}
            <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24 }}>
              {!isLastSlide && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Pagination dots - made white */}
                  <OnboardingPagination
                    slidesCount={ONBOARDING_SLIDES.length}
                    activeIndex={activeIndex}
                    onDotPress={(index) => {
                      flatListRef.current?.scrollToIndex({ index, animated: true });
                      setActiveIndex(index);
                    }}
                  />
                  
                  {/* Next Button */}
                  <Pressable
                    onPress={handleNext}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 30,
                      flexDirection: 'row',
                      gap: 8,
                      justifyContent: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    })}
                  >
                    <Text
                      style={{
                        color: COLORS.TEXT_PRIMARY,
                        fontWeight: '900',
                        fontSize: 16,
                      }}
                    >
                      Next
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.TEXT_PRIMARY} />
                  </Pressable>
                </View>
              )}

              {/* Auth buttons - only show on last slide */}
              {isLastSlide && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Pressable
                    onPress={() => router.push('/(auth)/login')}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: COLORS.PRIMARY,
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: 'center',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    })}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
                      Login
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(auth)/register')}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <Text style={{ color: COLORS.PRIMARY, fontWeight: '900', fontSize: 16 }}>
                      Create Account
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}