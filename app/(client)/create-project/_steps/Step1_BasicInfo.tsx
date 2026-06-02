// app/(client)/create-project/steps/Step1_BasicInfo.tsx
/**
 * @fileoverview Step 1: Basic project information
 * Collects project name, description, category, and timeline
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/colors';
import { ProjectData } from '..';
import { createStyles } from '@/utils/createStyles';

const categories: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'residential', label: 'Residential', icon: 'home-outline' },
  { id: 'commercial', label: 'Commercial', icon: 'business-outline' },
  { id: 'industrial', label: 'Industrial', icon: 'construct-outline' },
  { id: 'infrastructure', label: 'Infrastructure', icon: 'water-outline' },
  { id: 'renovation', label: 'Renovation', icon: 'hammer-outline' },
  { id: 'interior', label: 'Interior Fit-out', icon: 'brush-outline' },
  { id: 'landscaping', label: 'Landscaping', icon: 'leaf-outline' },
  { id: 'public_works', label: 'Public Works', icon: 'school-outline' },
];

interface Step1Props {
  data: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

export default function Step1_BasicInfo({ data, onUpdate, onNext }: Step1Props) {
  const [basic, setBasic] = useState(data.basic);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Project name is required';
        if (value.trim().length < 5) return 'Name must be at least 5 characters';
        return '';
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 20) return 'Description must be at least 20 characters';
        return '';
      case 'startDate':
        if (!value) return 'Start date is required';
        return '';
      case 'endDate':
        if (!value) return 'End date is required';
        if (basic.startDate && value <= basic.startDate) {
          return 'End date must be after start date';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field: string, value: any) => {
    const newBasic = { ...basic, [field]: value };
    setBasic(newBasic);
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      handleChange('startDate', selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      handleChange('endDate', selectedDate);
    }
  };

  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    ['name', 'description', 'startDate', 'endDate'].forEach(field => {
      const error = validateField(field, basic[field as keyof typeof basic]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    if (!basic.category) {
      newErrors.category = 'Please select a project category';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (isValid) {
      onUpdate({ basic });
      onNext();
    } else {
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={{ padding: 24 }}>
      {/* Title */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
          Tell us about your project
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
          Start with the basic details to get started
        </Text>
      </View>

      {/* Project Name */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.label}>
          Project Name <Text style={{ color: COLORS.ERROR }}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="e.g., Luxury Villa in Nyarutarama"
          placeholderTextColor={COLORS.TEXT_LIGHT}
          value={basic.name}
          onChangeText={(text) => handleChange('name', text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Category Dropdown */}
      <View style={{ marginBottom: 20, zIndex: 10 }}>
        <Text style={styles.label}>
          Project Category <Text style={{ color: COLORS.ERROR }}>*</Text>
        </Text>
        <Pressable
          onPress={() => setShowDropdown(!showDropdown)}
          style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {basic.category ? (
              <>
                <Ionicons
                  name={categories.find(c => c.id === basic.category)?.icon || 'construct-outline'}
                  size={20}
                  color={COLORS.PRIMARY}
                />
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: '500' }}>
                  {categories.find(c => c.id === basic.category)?.label || basic.category}
                </Text>
              </>
            ) : (
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 16 }}>Select a category...</Text>
            )}
          </View>
          <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.TEXT_SECONDARY} />
        </Pressable>

        {showDropdown && (
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 12,
              borderWidth: 1,
              marginTop: 6,
              maxHeight: 200,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    handleChange('category', cat.id);
                    setShowDropdown(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.BORDER_LIGHT,
                    backgroundColor: basic.category === cat.id
                      ? COLORS.PRIMARY_LIGHT
                      : pressed
                        ? COLORS.MUTED
                        : COLORS.SURFACE,
                  })}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={basic.category === cat.id ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
                  />
                  <Text
                    style={{
                      color: basic.category === cat.id ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY,
                      fontWeight: basic.category === cat.id ? '700' : '400',
                      fontSize: 15,
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Description */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.label}>
          Project Description <Text style={{ color: COLORS.ERROR }}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          placeholder="Describe the scope, requirements, and expectations..."
          placeholderTextColor={COLORS.TEXT_LIGHT}
          multiline
          numberOfLines={4}
          value={basic.description}
          onChangeText={(text) => handleChange('description', text)}
        />
        <Text style={styles.helperText}>
          {basic.description.length}/20 characters minimum
        </Text>
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      {/* Dates */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
        {/* Start Date */}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            Start Date <Text style={{ color: COLORS.ERROR }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={{ flex: 1, color: basic.startDate ? COLORS.TEXT_PRIMARY : COLORS.TEXT_LIGHT }}>
              {basic.startDate ? formatDate(basic.startDate) : 'Select start date'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_SECONDARY} />
          </Pressable>
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>

        {/* End Date */}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            End Date <Text style={{ color: COLORS.ERROR }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowEndDatePicker(true)}
            style={styles.dateButton}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={{ flex: 1, color: basic.endDate ? COLORS.TEXT_PRIMARY : COLORS.TEXT_LIGHT }}>
              {basic.endDate ? formatDate(basic.endDate) : 'Select end date'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_SECONDARY} />
          </Pressable>
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>
      </View>

      {/* Duration Info */}
      {basic.startDate && basic.endDate && basic.endDate > basic.startDate && (
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>
            Project duration: {Math.ceil((basic.endDate.getTime() - basic.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </Text>
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={basic.startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={basic.endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={basic.startDate || new Date()}
        />
      )}

      {/* Continue Button */}
      <Pressable
        onPress={validateAndContinue}
        style={styles.continueButton}
      >
        <Text style={styles.continueButtonText}>Continue to Budget</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = createStyles({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});