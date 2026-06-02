import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface IndependentSupervisorStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FOCUS_AREAS = [
  'Residential Housing',
  'Commercial Buildings',
  'Civil/Infrastructure',
  'Industrial Plants',
  'Environmental/Safety Audits',
];

export default function IndependentSupervisorStep({ data, onUpdate, onNext, onPrev }: IndependentSupervisorStepProps) {
  const [licenseNumber, setLicenseNumber] = useState(data.roleSpecific?.licenseNumber || '');
  const [focusArea, setFocusArea] = useState<string>(data.roleSpecific?.focusArea || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    data.roleSpecific?.yearsOfExperience || ''
  );
  const [certifyingBody, setCertifyingBody] = useState(data.roleSpecific?.certifyingBody || 'IER / Ministry of Infrastructure');

  const handleContinue = () => {
    if (!licenseNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your Certified License Number.');
      return;
    }
    if (!focusArea) {
      Alert.alert('Required Field', 'Please select your Primary Focus Area.');
      return;
    }
    if (!yearsOfExperience || isNaN(Number(yearsOfExperience))) {
      Alert.alert('Invalid Input', 'Please enter a valid number of years of experience.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        licenseNumber: licenseNumber.trim(),
        focusArea,
        yearsOfExperience: Number(yearsOfExperience),
        certifyingBody: certifyingBody.trim(),
      },
    });

    onNext();
  };

  const isFormValid =
    licenseNumber.trim() &&
    focusArea &&
    yearsOfExperience.trim();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Supervisor Credentials</Text>
        <Text style={styles.subtitle}>
          Please enter your professional licenses. Independent supervisors must hold current certificates of practice.
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* License Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Certified License Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., QA/SUP/2026/099"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Certifying Body */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Certifying Authority / Affiliation
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="ribbon-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Institution of Engineers Rwanda (IER)"
              value={certifyingBody}
              onChangeText={setCertifyingBody}
            />
          </View>
        </View>

        {/* Years of Experience */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Years of Inspection Experience <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="time-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 8"
              keyboardType="numeric"
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
            />
          </View>
        </View>

        {/* Focus Area */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Primary Inspection Focus Area <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipsContainer}>
            {FOCUS_AREAS.map((area) => {
              const isSelected = focusArea === area;
              return (
                <Pressable
                  key={area}
                  onPress={() => setFocusArea(area)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : null,
                  ]}
                >
                  <Text style={[styles.chipText, isSelected ? styles.chipTextActive : null]}>
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Continue */}
      <Pressable
        onPress={handleContinue}
        disabled={!isFormValid}
        style={[
          styles.submitBtn,
          isFormValid ? styles.submitBtnActive : styles.submitBtnDisabled,
        ]}
      >
        <Text style={styles.submitBtnText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    lineHeight: 18,
  },
  form: {
    gap: 18,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  required: {
    color: COLORS.ERROR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  chipActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.MUTED,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
