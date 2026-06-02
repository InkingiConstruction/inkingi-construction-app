import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { createStyles } from '@/utils/createStyles';
import type { UserRole } from '@/app/(auth)/register';

interface RoleConfig {
  id: UserRole;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  features: string[];
  color: string;
  bgColor: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'client',
    title: 'Client',
    icon: 'home-outline',
    description: 'Property owner looking to build or renovate',
    features: ['Post projects', 'Secure escrow payments', 'Track progress', 'Hire professionals'],
    color: COLORS.PRIMARY,
    bgColor: COLORS.PRIMARY_LIGHT,
  },
  {
    id: 'engineer',
    title: 'Engineer',
    icon: 'construct-outline',
    description: 'Professional engineer or engineering firm',
    features: ['Get hired', 'Submit BOQs', 'Request quotations', 'Earn via escrow'],
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  {
    id: 'supervisor',
    title: 'Supervisor',
    icon: 'shield-checkmark-outline',
    description: 'Construction supervisor or inspection company',
    features: ['Site inspections', 'Approve milestones', 'Quality standards', 'Progress reports'],
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    icon: 'cube-outline',
    description: 'Construction materials and equipment supplier',
    features: ['Receive RFQs', 'Submit quotes', 'Get paid via escrow', 'Expand reach'],
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
];

interface RoleSelectionStepProps {
  onSelect: (role: UserRole) => void;
}

export default function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  const [selected, setSelected] = useState<UserRole | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>      
        {/* Heading */}
        <Text style={styles.heading}>Choose Your Role</Text>
        <Text style={styles.subheading}>Select how you want to use InkingiPro to get started.</Text>

        {/* Role cards */}
        {ROLES.map((role) => {
          const isSelected = selected === role.id;
          return (
            <Pressable
              key={role.id}
              onPress={() => setSelected(role.id)}
              style={[styles.card, isSelected && { borderColor: role.color, backgroundColor: role.bgColor }]}
            >
              <View style={[styles.iconBox, { backgroundColor: role.bgColor }]}>
                <Ionicons name={role.icon} size={28} color={role.color} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{role.title}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={role.color} />}
                </View>
                <Text style={styles.cardDesc}>{role.description}</Text>
                <View style={styles.featureRow}>
                  {role.features.map((f, i) => (
                    <View key={i} style={[styles.featureChip, { backgroundColor: role.bgColor }]}>
                      <Ionicons name="checkmark" size={10} color={role.color} />
                      <Text style={[styles.featureText, { color: role.color }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Already have account */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>

        {/* Continue */}
        <Pressable
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 14 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { gap: 2 },
  appName: { fontSize: 22, fontWeight: '900', color: COLORS.TEXT_PRIMARY },
  tagline: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subheading: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 24, lineHeight: 18 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.SURFACE, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.BORDER_LIGHT,
    padding: 14, marginBottom: 14,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  cardDesc: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 8 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
  },
  featureText: { fontSize: 10, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 20 },
  loginLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 13 },
  loginLink: { color: COLORS.PRIMARY, fontWeight: '700', fontSize: 13 },
  continueBtn: {
    backgroundColor: COLORS.PRIMARY, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: COLORS.MUTED, opacity: 0.6 },
  continueBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
