// /components/onboarding/OnboardingPagination.tsx
/**
 * @fileoverview Pagination dots for onboarding slides
 * Shows current slide position with animated dots
 */

import React, { useEffect } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '@/constants/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OnboardingPaginationProps {
  slidesCount: number;
  activeIndex: number;
  onDotPress: (index: number) => void;
}

export default function OnboardingPagination({
  slidesCount,
  activeIndex,
  onDotPress,
}: OnboardingPaginationProps) {
  // Animate width change when activeIndex changes
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeIndex]);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length: slidesCount }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => onDotPress(index)}
          style={{
            backgroundColor: index === activeIndex ? COLORS.PRIMARY : COLORS.BORDER,
            borderRadius: 999,
            height: 8,
            width: index === activeIndex ? 32 : 8,
          }}
        />
      ))}
    </View>
  );
}