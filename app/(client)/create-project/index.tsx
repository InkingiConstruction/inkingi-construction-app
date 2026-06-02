// app/(client)/create-project/index.tsx
/**
 * @fileoverview Multi-step project creation wizard
 * Manages state across 5 steps with progress indicator
 * 
 * Steps:
 * 1. Basic Info - Project name, description, dates
 * 2. Budget - Budget amount, currency, visual chart
 * 3. Location - GPS boundary drawing on map
 * 4. Documents - Site photos, architectural plans
 * 5. Review - Summary & submit
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import StepIndicator from "@/components/shared/StepIndicator";
import Step1_BasicInfo from './_steps/Step1_BasicInfo';
import Step2_Budget from './_steps/Step2_Budget';
import Step3_Location from './_steps/Step3_Location';
import Step4_Documents from './_steps/Step4_Documents';
import Step5_Review from './_steps/Step5_Review';

export interface ProjectData {
  // Step 1: Basic Info
  basic: {
    name: string;
    description: string;
    category: string;
    startDate: Date | null;
    endDate: Date | null;
  };
  
  // Step 2: Budget
  budget: {
    totalAmount: number;
    currency: 'RWF' | 'USD';
    exchangeRate?: number;
  };
  
  // Step 3: Location
  location: {
    coordinates: Array<{ latitude: number; longitude: number }>;
    area: number;
    address?: string;
    upi?: string;
    ownerName?: string;
    landUse?: string;
  };
  
  // Step 4: Documents
  documents: {
    sitePhotos: Array<{ uri: string; fileName: string; uploaded: boolean; url?: string }>;
    architecturalPlans: Array<{ uri: string; fileName: string; uploaded: boolean; url?: string }>;
  };
  
  // Metadata
  currentStep: number;
  isSubmitting: boolean;
}

const initialProjectData: ProjectData = {
  basic: {
    name: '',
    description: '',
    category: 'residential',
    startDate: null,
    endDate: null,
  },
  budget: {
    totalAmount: 0,
    currency: 'RWF',
  },
  location: {
    coordinates: [],
    area: 0,
  },
  documents: {
    sitePhotos: [],
    architecturalPlans: [],
  },
  currentStep: 0,
  isSubmitting: false,
};

const steps: {
  number: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { number: 1, title: 'Basic Info', icon: 'document-text-outline' },
  { number: 2, title: 'Budget', icon: 'cash-outline' },
  { number: 3, title: 'Location', icon: 'location-outline' },
  { number: 4, title: 'Documents', icon: 'images-outline' },
  { number: 5, title: 'Review', icon: 'checkmark-circle-outline' },
];

export default function CreateProjectWizard() {
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateProjectData = (updates: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...updates }));
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Scroll to top
      if (Platform.OS === 'web') window.scrollTo(0, 0);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (Platform.OS === 'web') window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    const props = {
      data: projectData,
      onUpdate: updateProjectData,
      onNext: goToNextStep,
      onPrev: goToPrevStep,
    };

    switch (currentStep) {
      case 0:
        return <Step1_BasicInfo {...props} />;
      case 1:
        return <Step2_Budget {...props} />;
      case 2:
        return <Step3_Location {...props} />;
      case 3:
        return <Step4_Documents {...props} />;
      case 4:
        return <Step5_Review {...props} />;
      default:
        return <Step1_BasicInfo {...props} />;
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
        {/* Header with Back Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.BORDER_LIGHT,
            backgroundColor: COLORS.SURFACE,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: 'bold',
              color: COLORS.TEXT_PRIMARY,
              textAlign: 'center',
              marginRight: 44, // Balance the back button width
            }}
          >
            Create Project
          </Text>
        </View>

        {/* Step Indicator */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepPress={goToStep}
        />

        {/* Step Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {renderStep()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}