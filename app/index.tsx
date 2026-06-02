// /app/index.tsx
/**
 * @fileoverview App entry point - checks if onboarding has been shown
 * First launch shows onboarding, subsequent launches show landing page
 * 
 * @responsibility
 * - Check AsyncStorage for onboarding completion status
 * - Conditionally render onboarding or landing
 * - Handle loading state while checking storage
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import LandingScreen from './landing';
import { COLORS } from '@/constants/colors';

const ONBOARDING_KEY = '@onboarding_completed';

export default function AppIndex() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      // Show onboarding only if not completed
      setShowOnboarding(completed !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <LandingScreen />;
}