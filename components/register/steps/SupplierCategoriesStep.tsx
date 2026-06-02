import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface SupplierCategoriesStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CATEGORIES = [
  { id: 'cement', label: 'Cement & Aggregates', desc: 'Portland cement, sand, gravel, stone dust' },
  { id: 'steel', label: 'Steel & Reinforcements', desc: 'Rebars, iron sheets, steel beams, wire mesh' },
  { id: 'masonry', label: 'Masonry & Blocks', desc: 'Concrete blocks, clay bricks, paving stones' },
  { id: 'plumbing', label: 'Plumbing & Pipes', desc: 'PVC pipes, water tanks, copper tubes, fittings' },
  { id: 'electrical', label: 'Electrical Supplies', desc: 'Cables, conduits, breakers, lighting, switches' },
  { id: 'timber', label: 'Timber & Carpentry', desc: 'Plywood, structural timber, roofing trusses, doors' },
  { id: 'finishes', label: 'Finishes & Tiles', desc: 'Ceramic tiles, granite slabs, paint, plaster' },
  { id: 'tools', label: 'Tools & Safety Equipment', desc: 'Hand tools, power tools, helmets, safety harnesses' },
  { id: 'machinery', label: 'Heavy Machinery Rental', desc: 'Excavators, mixers, scaffolding, compactors' },
];

export default function SupplierCategoriesStep({ data, onUpdate, onNext, onPrev }: SupplierCategoriesStepProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    data.roleSpecific?.categories || []
  );

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(prev => prev.filter(c => c !== id));
    } else {
      setSelectedCategories(prev => [...prev, id]);
    }
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one material supply category.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        categories: selectedCategories,
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
        <Text style={styles.title}>Supply Catalog</Text>
        <Text style={styles.subtitle}>
          Select all categories of construction materials or services that your business supplies.
        </Text>
      </View>

      {/* Categories Checklist */}
      <View style={styles.list}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => toggleCategory(cat.id)}
              style={[
                styles.itemCard,
                isSelected ? styles.itemCardActive : null,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{cat.label}</Text>
                <Text style={styles.itemDesc}>{cat.desc}</Text>
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
        disabled={selectedCategories.length === 0}
        style={[
          styles.submitBtn,
          selectedCategories.length > 0 ? styles.submitBtnActive : styles.submitBtnDisabled,
        ]}
      >
        <Text style={styles.submitBtnText}>Continue ({selectedCategories.length} selected)</Text>
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
