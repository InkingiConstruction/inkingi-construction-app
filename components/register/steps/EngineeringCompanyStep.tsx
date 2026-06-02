import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface EngineeringCompanyStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function EngineeringCompanyStep({ data, onUpdate, onNext, onPrev }: EngineeringCompanyStepProps) {
  const [companyName, setCompanyName] = useState(data.roleSpecific?.companyName || '');
  const [tinNumber, setTinNumber] = useState(data.roleSpecific?.tinNumber || '');
  const [officeAddress, setOfficeAddress] = useState(data.roleSpecific?.officeAddress || '');
  const [repName, setRepName] = useState(data.roleSpecific?.repName || '');
  const [repPosition, setRepPosition] = useState(data.roleSpecific?.repPosition || '');

  const handleContinue = () => {
    if (!companyName.trim()) {
      Alert.alert('Required Field', 'Please enter the Engineering Company Name.');
      return;
    }
    if (!tinNumber.trim() || tinNumber.trim().length !== 9 || isNaN(Number(tinNumber))) {
      Alert.alert('Invalid Input', 'Please enter a valid 9-digit Corporate TIN.');
      return;
    }
    if (!officeAddress.trim()) {
      Alert.alert('Required Field', 'Please enter the Company Address.');
      return;
    }
    if (!repName.trim()) {
      Alert.alert('Required Field', 'Please enter the Authorized Representative Name.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        companyName: companyName.trim(),
        tinNumber: tinNumber.trim(),
        officeAddress: officeAddress.trim(),
        repName: repName.trim(),
        repPosition: repPosition.trim(),
      },
    });

    onNext();
  };

  const isFormValid =
    companyName.trim() &&
    tinNumber.trim().length === 9 &&
    officeAddress.trim() &&
    repName.trim();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Company Profile</Text>
        <Text style={styles.subtitle}>
          Please enter your registered firm's details. These will be verified with RDB registry.
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Company Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Registered Company Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Inkingi Design Group Ltd"
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>
        </View>

        {/* TIN Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            RDB TIN Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 102938475 (9-digits)"
              keyboardType="numeric"
              maxLength={9}
              value={tinNumber}
              onChangeText={setTinNumber}
            />
          </View>
        </View>

        {/* Office Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Office Physical Address <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="map-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., KN 3 Rd, Kigali, Rwanda"
              value={officeAddress}
              onChangeText={setOfficeAddress}
            />
          </View>
        </View>

        {/* Rep Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Authorized Representative Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Full legal name"
              value={repName}
              onChangeText={setRepName}
            />
          </View>
        </View>

        {/* Rep Position */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Representative Position / Title
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Managing Director / CEO"
              value={repPosition}
              onChangeText={setRepPosition}
            />
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
