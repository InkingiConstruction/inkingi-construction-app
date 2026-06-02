import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface EngineerTypeStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function EngineerTypeStep({ data, onUpdate, onNext, onPrev }: EngineerTypeStepProps) {
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(
    data.roleSpecific?.engineerType || null
  );

  const handleContinue = () => {
    if (!selectedType) return;
    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        engineerType: selectedType,
      },
    });
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Engineer Category</Text>
        <Text style={styles.subtitle}>
          Are you registering as an independent consulting engineer or representing a registered engineering firm?
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Individual */}
        <Pressable
          onPress={() => setSelectedType('individual')}
          style={[
            styles.card,
            selectedType === 'individual' ? styles.cardActive : null,
          ]}
        >
          <View style={[styles.iconCircle, selectedType === 'individual' ? styles.iconCircleActive : null]}>
            <Ionicons
              name="person-outline"
              size={32}
              color={selectedType === 'individual' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Individual Engineer</Text>
            <Text style={styles.cardDesc}>
              For independent professionals, freelance project managers, or certified consultants.
            </Text>
          </View>
          <View style={[styles.radio, selectedType === 'individual' ? styles.radioChecked : null]}>
            {selectedType === 'individual' && <View style={styles.radioInner} />}
          </View>
        </Pressable>

        {/* Company */}
        <Pressable
          onPress={() => setSelectedType('company')}
          style={[
            styles.card,
            selectedType === 'company' ? styles.cardActive : null,
          ]}
        >
          <View style={[styles.iconCircle, selectedType === 'company' ? styles.iconCircleActive : null]}>
            <Ionicons
              name="business-outline"
              size={32}
              color={selectedType === 'company' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Engineering Company</Text>
            <Text style={styles.cardDesc}>
              For licensed contracting firms, construction companies, or project architectural agencies.
            </Text>
          </View>
          <View style={[styles.radio, selectedType === 'company' ? styles.radioChecked : null]}>
            {selectedType === 'company' && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      </View>

      {/* Continue */}
      <Pressable
        onPress={handleContinue}
        disabled={!selectedType}
        style={[
          styles.submitBtn,
          selectedType ? styles.submitBtnActive : styles.submitBtnDisabled,
        ]}
      >
        <Text style={styles.submitBtnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
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
    marginBottom: 32,
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
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  cardActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#FFF',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: {
    borderColor: COLORS.PRIMARY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
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
