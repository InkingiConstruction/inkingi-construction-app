// app/(client)/create-project/components/StepIndicator.tsx
/**
 * @fileoverview Visual step indicator showing progress through wizard
 * Displays 5 steps with icons, active/inactive states, and completion status
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface Step {
  number: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepPress?: (step: number) => void;
}

export default function StepIndicator({ steps, currentStep, onStepPress }: StepIndicatorProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_LIGHT,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 6,
        }}
      >
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;
          
          return (
            <Pressable
              key={step.number}
              onPress={() => onStepPress?.(index)}
              disabled={!isCompleted && !isActive}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 16,
                backgroundColor: isActive 
                  ? COLORS.PRIMARY_LIGHT 
                  : isCompleted 
                    ? `${COLORS.SUCCESS}15` 
                    : COLORS.MUTED,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isActive 
                    ? COLORS.PRIMARY 
                    : isCompleted 
                      ? COLORS.SUCCESS 
                      : COLORS.TEXT_LIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                    {step.number}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 'bold' : '500',
                  color: isActive 
                    ? COLORS.PRIMARY 
                    : isCompleted 
                      ? COLORS.SUCCESS 
                      : COLORS.TEXT_SECONDARY,
                }}
              >
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={COLORS.TEXT_LIGHT}
                  style={{ marginLeft: 2 }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}