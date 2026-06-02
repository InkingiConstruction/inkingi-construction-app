import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

interface ProgressStepperProps {
  currentStep: number;
  steps: string[];
}

export default function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  const totalSteps = steps.length;
  const progressPercent = ((currentStep) / (totalSteps - 1)) * 100;

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

      {/* Progress Bar */}
      {/* <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View> */}

      {/* Mini dots indicator (if steps count is reasonable) */}
      <View style={styles.dotsRow}>
        {steps.map((_, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive && styles.activeDot,
                isCompleted && styles.completedDot,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  stepCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.BORDER_LIGHT,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 4,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  activeDot: {
    backgroundColor: COLORS.PRIMARY,
  },
  completedDot: {
    backgroundColor: COLORS.PRIMARY_DARK,
  },
});
