import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface IndividualEngineerStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const EXPERTISE_FIELDS = [
  'Civil Engineering',
  'Structural Engineering',
  'Architectural design',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Geotechnical/Soil',
];

export default function IndividualEngineerStep({ data, onUpdate, onNext, onPrev }: IndividualEngineerStepProps) {
  const [ierNumber, setIerNumber] = useState(data.roleSpecific?.ierNumber || '');
  const [fieldOfExpertise, setFieldOfExpertise] = useState<string>(
    data.roleSpecific?.fieldOfExpertise || ''
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(
    data.roleSpecific?.yearsOfExperience || ''
  );
  const [degreeTitle, setDegreeTitle] = useState(data.roleSpecific?.degreeTitle || '');

  const handleContinue = () => {
    if (!ierNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your IER Registration Number.');
      return;
    }
    if (!fieldOfExpertise) {
      Alert.alert('Required Field', 'Please select your Field of Expertise.');
      return;
    }
    if (!yearsOfExperience || isNaN(Number(yearsOfExperience))) {
      Alert.alert('Invalid Input', 'Please enter a valid number of years of experience.');
      return;
    }
    if (!degreeTitle.trim()) {
      Alert.alert('Required Field', 'Please enter your Degree Title.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        ierNumber: ierNumber.trim(),
        fieldOfExpertise,
        yearsOfExperience: Number(yearsOfExperience),
        degreeTitle: degreeTitle.trim(),
      },
    });

    onNext();
  };

  const isFormValid =
    ierNumber.trim() &&
    fieldOfExpertise &&
    yearsOfExperience.trim() &&
    degreeTitle.trim();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Professional Profile</Text>
        <Text style={styles.subtitle}>
          Please enter your credentials. We verify this info with the Institution of Engineers Rwanda (IER).
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* IER Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            IER Registration Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="ribbon-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., IER/ENG/1234"
              value={ierNumber}
              onChangeText={setIerNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Degree Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Academic Degree Title <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="school-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., B.Sc. in Civil Engineering"
              value={degreeTitle}
              onChangeText={setDegreeTitle}
            />
          </View>
        </View>

        {/* Years of Experience */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Years of Active Experience <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="time-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              keyboardType="numeric"
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
            />
          </View>
        </View>

        {/* Field of Expertise */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Primary Field of Expertise <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipsContainer}>
            {EXPERTISE_FIELDS.map((field) => {
              const isSelected = fieldOfExpertise === field;
              return (
                <Pressable
                  key={field}
                  onPress={() => setFieldOfExpertise(field)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : null,
                  ]}
                >
                  <Text style={[styles.chipText, isSelected ? styles.chipTextActive : null]}>
                    {field}
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
