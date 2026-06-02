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
import { useAuthStore, getRoleHome } from '@/store/auth.store';
import { router } from 'expo-router';

const ONBOARDING_KEY = '@onboarding_completed';

export default function AppIndex() {
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const authLoading = useAuthStore((state) => state.loading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // If auth state is fully loaded and user is authenticated, redirect directly
    if (!authLoading && !onboardingLoading) {
      if (isAuthenticated && user) {
        router.replace(getRoleHome(user.role) as any);
      }
    }
  }, [authLoading, onboardingLoading, isAuthenticated, user]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      // Show onboarding only if not completed
      setShowOnboarding(completed !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding on error
    } finally {
      setOnboardingLoading(false);
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

  // While either onboarding or auth check is in progress, show loading spinner
  if (onboardingLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  // If authenticated and user exists, we already trigger redirect, but return loading to avoid flash
  if (isAuthenticated && user) {
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