// app/(client)/create-project/steps/Step5_Review.tsx
/**
 * @fileoverview Step 5: Review all project information before submission
 * Shows summary of all steps with edit buttons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';
import { COLORS } from '@/constants/colors';
import { ProjectData } from '..';
import { useQueryClient } from '@tanstack/react-query';
import { createStyles } from '@/utils/createStyles';

interface Step5Props {
  data: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onPrev: () => void;
}

export default function Step5_Review({ data, onPrev }: Step5Props) {
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const queryClient = useQueryClient();

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: data.budget.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      residential: 'Residential',
      commercial: 'Commercial',
      industrial: 'Industrial',
      infrastructure: 'Infrastructure',
      renovation: 'Renovation',
      interior: 'Interior Fit-out',
      landscaping: 'Landscaping',
      public_works: 'Public Works',
    };
    return categories[category] || category;
  };

  const handleSubmit = async () => {
    if (!agreed) {
      Alert.alert('Confirmation Required', 'Please confirm that all information is accurate');
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Basic Info
      formData.append('name', data.basic.name);
      formData.append('description', data.basic.description);
      formData.append('category', data.basic.category);
      formData.append('startDate', data.basic.startDate?.toISOString() || '');
      formData.append('endDate', data.basic.endDate?.toISOString() || '');
      
      // Budget
      formData.append('budget', data.budget.totalAmount.toString());
      formData.append('currency', data.budget.currency);
      
      // Location
      formData.append('boundary', JSON.stringify(data.location.coordinates));
      formData.append('area', data.location.area.toString());
      
      // Documents
      data.documents.sitePhotos.forEach((photo, index) => {
        formData.append('sitePhotos', {
          uri: photo.uri,
          name: photo.fileName,
          type: 'image/jpeg',
        } as any);
      });
      
      data.documents.architecturalPlans.forEach((plan, index) => {
        formData.append('architecturalPlans', {
          uri: plan.uri,
          name: plan.fileName,
          type: 'application/pdf',
        } as any);
      });
      
      await api.post(ENDPOINTS.PROJECTS.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['client-escrow-accounts'] }),
      ]);
      
      Alert.alert(
        'Success',
        'Your project has been created successfully!',
        [
          {
            text: 'View Project',
            onPress: () => router.replace('/(client)/projects'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 24 }}>
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
            Review Your Project
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
            Please verify all information before submitting
          </Text>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Pressable onPress={onPrev}>
              <Text style={styles.editButton}>Edit</Text>
            </Pressable>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Project Name:</Text>
            <Text style={styles.value}>{data.basic.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{getCategoryLabel(data.basic.category)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{data.basic.description}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Timeline:</Text>
            <Text style={styles.value}>
              {formatDate(data.basic.startDate)} - {formatDate(data.basic.endDate)}
            </Text>
          </View>
        </View>

        {/* Budget Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Budget:</Text>
            <Text style={[styles.value, styles.budgetValue]}>
              {formatMoney(data.budget.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Site Location</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Boundary Points:</Text>
            <Text style={styles.value}>{data.location.coordinates.length} points</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Site Area:</Text>
            <Text style={styles.value}>{(data.location.area / 10000).toFixed(2)} hectares</Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Site Photos:</Text>
            <Text style={styles.value}>{data.documents.sitePhotos.length} uploaded</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Architectural Plans:</Text>
            <Text style={styles.value}>{data.documents.architecturalPlans.length} uploaded</Text>
          </View>
        </View>

        {/* Confirmation Checkbox */}
        <Pressable
          onPress={() => setAgreed(!agreed)}
          style={styles.checkboxContainer}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm that all information provided is accurate and complete
          </Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.submitButton,
            (!agreed || submitting) && styles.disabledButton,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>Create Project</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = createStyles({
  section: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  editButton: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right' as const,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    padding: 12,
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.PRIMARY,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.MUTED,
  },
});