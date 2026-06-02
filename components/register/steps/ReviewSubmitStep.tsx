import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface ReviewSubmitStepProps {
  data: any;
  onPrev: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function ReviewSubmitStep({ data, onPrev, onSubmit, loading }: ReviewSubmitStepProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);

  const role = data.basic?.role;

  const renderSummarySection = (title: string, items: Array<{ label: string; value: string | number | string[] }>) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.divider} />
        {items.map((item, idx) => {
          let valStr = '';
          if (Array.isArray(item.value)) {
            valStr = item.value.join(', ');
          } else {
            valStr = String(item.value || 'N/A');
          }

          return (
            <View key={idx} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{valStr}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const getRoleSpecificSummary = () => {
    const rs = data.roleSpecific || {};
    switch (role) {
      case 'client':
        return renderSummarySection('KYC & Verification Info', [
          { label: 'Verification Type', value: 'Client KYC' },
          { label: 'Selfie Matched', value: rs.selfieUploaded ? 'Verified' : 'Pending' }
        ]);

      case 'engineer':
        return renderSummarySection('Engineering Details', [
          { label: 'Tier Type', value: rs.engineerType === 'individual' ? 'Independent Consultant' : 'Engineering Company' },
          ...(rs.engineerType === 'individual'
            ? [
                { label: 'IER Registration #', value: rs.ierNumber },
                { label: 'Expertise Field', value: rs.fieldOfExpertise },
                { label: 'Academic Degree', value: rs.degreeTitle },
                { label: 'Experience Years', value: `${rs.yearsOfExperience} Years` }
              ]
            : [
                { label: 'Firm Name', value: rs.companyName },
                { label: 'Firm TIN Number', value: rs.tinNumber },
                { label: 'Firm Address', value: rs.officeAddress },
                { label: 'Representative Name', value: rs.repName },
                { label: 'Representative Title', value: rs.repPosition }
              ])
        ]);

      case 'supervisor':
        return renderSummarySection('Supervision Details', [
          { label: 'Tier Type', value: rs.supervisorType === 'independent' ? 'Independent QA Inspector' : 'Building Inspection Firm' },
          ...(rs.supervisorType === 'independent'
            ? [
                { label: 'License / Practice #', value: rs.licenseNumber },
                { label: 'Inspection Focus', value: rs.focusArea },
                { label: 'Certifying Authority', value: rs.certifyingBody },
                { label: 'Experience Years', value: `${rs.yearsOfExperience} Years` }
              ]
            : [
                { label: 'Inspection Firm Name', value: rs.companyName },
                { label: 'Firm TIN Number', value: rs.tinNumber },
                { label: 'ISO / RSB Certification #', value: rs.accreditationCode },
                { label: 'Office Address', value: rs.officeAddress },
                { label: 'Lead Auditor/Inspector', value: rs.repName }
              ])
        ]);

      case 'supplier':
        return renderSummarySection('Supplier & Logistics Details', [
          { label: 'Company Name', value: rs.companyName },
          { label: 'RDB TIN Number', value: rs.tinNumber },
          { label: 'Contact Person', value: rs.contactPerson },
          { label: 'Material Categories', value: rs.categories },
          { label: 'Delivery Coverage', value: rs.coverageAreas },
          { label: 'Office Address', value: rs.location?.address }
        ]);

      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Review Profile</Text>
        <Text style={styles.subtitle}>
          Verify that your registration details match your official documents before submitting.
        </Text>
      </View>

      {/* Basic Account Summary */}
      {renderSummarySection('Account Information', [
        { label: 'Full Legal Name', value: data.basic?.fullName },
        { label: 'Email Address', value: data.basic?.email },
        { label: 'Phone Number', value: data.basic?.phoneNumber },
        { label: 'Country', value: data.basic?.country },
        { label: 'Account Role', value: String(role).toUpperCase() }
      ])}

      {/* Role specific info */}
      {getRoleSpecificSummary()}

      {/* Uploaded Documents List Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uploaded Attachments</Text>
        <View style={styles.divider} />
        {(data.documents || []).length > 0 ? (
          (data.documents || []).map((doc: any, index: number) => (
            <View key={index} style={styles.docRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.docName} numberOfLines={1}>
                {doc.fileName}
              </Text>
              <Text style={styles.docStatus}>Ready</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDocs}>No attachments uploaded.</Text>
        )}
      </View>

      {/* Terms & Conditions */}
      <Pressable style={styles.termsRow} onPress={() => setAgreeTerms(!agreeTerms)} disabled={loading}>
        <View style={[styles.checkbox, agreeTerms ? styles.checkboxChecked : null]}>
          {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text style={styles.termsLabel}>
          I confirm that all entered details are accurate and represent legal information. I agree to InkingiPro's Escrow and Platform Terms of Service.
        </Text>
      </Pressable>

      {/* Submit Button */}
      <Pressable
        onPress={onSubmit}
        disabled={loading || !agreeTerms}
        style={[
          styles.submitBtn,
          agreeTerms ? styles.submitBtnActive : styles.submitBtnDisabled,
          loading ? styles.submitBtnLoading : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Application</Text>
        )}
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
  section: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER_LIGHT,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 2,
    textAlign: 'right',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  docName: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  docStatus: {
    fontSize: 11,
    color: COLORS.SUCCESS,
    fontWeight: '700',
  },
  noDocs: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontStyle: 'italic',
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  termsLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 16,
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
  submitBtnLoading: {
    opacity: 0.8,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
