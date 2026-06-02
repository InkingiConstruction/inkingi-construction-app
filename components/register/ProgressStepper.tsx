/**
 * @fileoverview Progress stepper component for multi-step registration
 * Shows step bars and allows clicking on completed bars to navigate back
 * 
 * @responsibility
 * - Display current step title and step count
 * - Show visual rectangular bars for each step
 * - Active step has larger width
 * - Allow clicking on completed bars to go back to previous steps
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '@/constants/colors';

interface ProgressStepperProps {
  currentStep: number;
  steps: string[];
  onStepPress?: (stepIndex: number) => void;
  allowBackNavigation?: boolean;
}

export default function ProgressStepper({ 
  currentStep, 
  steps, 
  onStepPress,
  allowBackNavigation = true 
}: ProgressStepperProps) {
  const totalSteps = steps.length;

  const handleDotPress = (index: number) => {
    // Only allow navigation to completed steps (previous steps)
    if (allowBackNavigation && index < currentStep && onStepPress) {
      onStepPress(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Info */}
      <View style={styles.infoRow}>
        <Text style={styles.stepTitle}>
          {steps[currentStep]}
        </Text>
        <Text style={styles.stepCount}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Rectangular bar indicators - fixed width, no flex */}
      <View style={styles.dotsRow}>
        {steps.map((_, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          // Active bar is wider, completed and pending are thinner
          let barWidth = 8;
          if (isActive) barWidth = 32;
          
          return (
            <Pressable
              key={index}
              onPress={() => handleDotPress(index)}
              disabled={!allowBackNavigation || !isCompleted}
              style={styles.barWrapper}
            >
              <View
                style={[
                  styles.bar,
                  { width: barWidth },
                  isActive && styles.activeBar,
                  isCompleted && styles.completedBar,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  stepCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  activeBar: {
    backgroundColor: COLORS.PRIMARY,
  },
  completedBar: {
    backgroundColor: COLORS.SUCCESS,
  },
});