import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { router } from 'expo-router';

export default function VerificationPendingStep() {
  const handleFinish = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Success Icon Illustration */}
      <View style={styles.illustration}>
        <View style={styles.pulseBg} />
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={64} color={COLORS.PRIMARY} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Registration Submitted!</Text>
        <Text style={styles.subtitle}>
          Your account application was received. Our verification officers are checking your RDB/IER licensing records.
        </Text>
      </View>

      {/* Steps Info */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>What Happens Next?</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailHead}>Document Validation</Text>
            <Text style={styles.detailBody}>We cross-reference your licenses with professional databases.</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailHead}>SMS & Email Alert</Text>
            <Text style={styles.detailBody}>You will receive notifications once your profile is activated.</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailHead}>Workspace Access</Text>
            <Text style={styles.detailBody}>Log in to access project boards, material requests, and escrow payouts.</Text>
          </View>
        </View>
      </View>

      {/* Finish Action */}
      <Pressable style={styles.finishBtn} onPress={handleFinish}>
        <Text style={styles.finishBtnText}>Return to Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 60,
  },
  illustration: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  pulseBg: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    opacity: 0.5,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    padding: 20,
    width: '100%',
    gap: 16,
    marginBottom: 36,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailHead: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  detailBody: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 16,
  },
  finishBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
