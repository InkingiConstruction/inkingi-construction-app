import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface SupplierCoverageStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const COVERAGES = [
  { id: 'nationwide', label: 'Nationwide Delivery', desc: 'Can supply materials anywhere in Rwanda' },
  { id: 'kasp', label: 'Kigali City Only', desc: 'Gasabo, Kicukiro, and Nyarugenge districts' },
  { id: 'east', label: 'Eastern Province', desc: 'Bugesera, Kayonza, Nyagatare, Rwamagana, etc.' },
  { id: 'west', label: 'Western Province', desc: 'Rubavu, Rusizi, Karongi, Nyamasheke, etc.' },
  { id: 'north', label: 'Northern Province', desc: 'Musanze, Gicumbi, Gakenke, Rulindo, Burera' },
  { id: 'south', label: 'Southern Province', desc: 'Huye, Muhanga, Kamonyi, Nyamagabe, etc.' },
];

export default function SupplierCoverageStep({ data, onUpdate, onNext, onPrev }: SupplierCoverageStepProps) {
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>(
    data.roleSpecific?.coverageAreas || []
  );

  const toggleCoverage = (id: string) => {
    if (id === 'nationwide') {
      if (selectedCoverages.includes('nationwide')) {
        setSelectedCoverages([]);
      } else {
        setSelectedCoverages(['nationwide']);
      }
      return;
    }

    let updated = [...selectedCoverages];
    // If nationwide was selected, remove it
    if (updated.includes('nationwide')) {
      updated = updated.filter(c => c !== 'nationwide');
    }

    if (updated.includes(id)) {
      updated = updated.filter(c => c !== id);
    } else {
      updated.push(id);
    }
    setSelectedCoverages(updated);
  };

  const handleContinue = () => {
    if (selectedCoverages.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one delivery coverage area.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        coverageAreas: selectedCoverages,
      },
    });

    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Coverage</Text>
        <Text style={styles.subtitle}>
          Select the regions of Rwanda where your business offers logistics and material deliveries.
        </Text>
      </View>

      {/* Checklist */}
      <View style={styles.list}>
        {COVERAGES.map((cov) => {
          const isSelected = selectedCoverages.includes(cov.id);
          return (
            <Pressable
              key={cov.id}
              onPress={() => toggleCoverage(cov.id)}
              style={[
                styles.itemCard,
                isSelected ? styles.itemCardActive : null,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{cov.label}</Text>
                <Text style={styles.itemDesc}>{cov.desc}</Text>
              </View>
              <View style={[styles.checkbox, isSelected ? styles.checkboxChecked : null]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Continue */}
      <Pressable
        onPress={handleContinue}
        disabled={selectedCoverages.length === 0}
        style={[
          styles.submitBtn,
          selectedCoverages.length > 0 ? styles.submitBtnActive : styles.submitBtnDisabled,
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
  list: {
    gap: 12,
    marginBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  itemCardActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.PRIMARY,
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
