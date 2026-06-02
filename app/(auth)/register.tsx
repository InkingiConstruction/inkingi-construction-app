import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';

import ProgressStepper from '@/components/register/ProgressStepper';
import RoleSelectionStep from '@/components/register/steps/RoleSelectionStep';
import BasicInfoStep from '@/components/register/steps/BasicInfoStep';
import EmailVerificationStep from '@/components/register/steps/EmailVerificationStep';
import PhoneVerificationStep from '@/components/register/steps/PhoneVerificationStep';
import ClientKYSStep from '@/components/register/steps/ClientKYSStep';
import EngineerTypeStep from '@/components/register/steps/EngineerTypeStep';
import IndividualEngineerStep from '@/components/register/steps/IndividualEngineerStep';
import EngineeringCompanyStep from '@/components/register/steps/EngineeringCompanyStep';
import SupervisorTypeStep from '@/components/register/steps/SupervisorTypeStep';
import IndependentSupervisorStep from '@/components/register/steps/IndependentSupervisorStep';
import InspectionCompanyStep from '@/components/register/steps/InspectionCompanyStep';
import SupplierInfoStep from '@/components/register/steps/SupplierInfoStep';
import SupplierCategoriesStep from '@/components/register/steps/SupplierCategoriesStep';
import SupplierCoverageStep from '@/components/register/steps/SupplierCoverageStep';
import SupplierLocationStep from '@/components/register/steps/SupplierLocationStep';
import SupplierPaymentStep from '@/components/register/steps/SupplierPaymentStep';
import DocumentUploadStep from '@/components/register/steps/DocumentUploadStep';
import ReviewSubmitStep from '@/components/register/steps/ReviewSubmitStep';
import VerificationPendingStep from '@/components/register/steps/VerificationPendingStep';

export type UserRole = 'client' | 'engineer' | 'supervisor' | 'supplier';

export interface RegistrationData {
  basic: {
    fullName: string;
    email: string;
    phoneNumber: string;
    country: string;
    password?: string;
    role: UserRole;
  };
  roleSpecific: any;
  emailVerified: boolean;
  phoneVerified: boolean;
  documents: any[];
  currentStep: number;
}

const STORAGE_KEY = '@inkingi_registration_data';

const DEFAULT_DATA = (role: UserRole = 'client'): RegistrationData => ({
  basic: { fullName: '', email: '', phoneNumber: '', country: 'Rwanda', role },
  roleSpecific: {},
  emailVerified: false,
  phoneVerified: false,
  documents: [],
  currentStep: 0,
});

// Lazy AsyncStorage to avoid "native module is null" crash on first paint
async function safeGetItem(key: string): Promise<string | null> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}
async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  } catch { /* silently ignore */ }
}
async function safeRemoveItem(key: string): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  } catch { /* silently ignore */ }
}

export default function RegisterFlow() {
  const params = useLocalSearchParams<{ role?: string }>();

  // Step -1 = role selection (fullscreen, no progress bar)
  // Step 0+ = role-specific steps
  const [roleSelected, setRoleSelected] = useState<boolean>(!!params.role);
  const [role, setRole] = useState<UserRole>((params.role as UserRole) || 'client');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const storeRegister = useAuthStore((s) => s.register);

  const [data, setData] = useState<RegistrationData>(DEFAULT_DATA((params.role as UserRole) || 'client'));

  // Load persisted progress
  useEffect(() => {
    (async () => {
      const saved = await safeGetItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: RegistrationData = JSON.parse(saved);
          if (parsed.basic?.role) {
            setRole(parsed.basic.role);
            setRoleSelected(true);
            setData(parsed);
          }
        } catch { /* corrupt data — start fresh */ }
      }
      setIsReady(true);
    })();
  }, []);

  const persist = useCallback((updated: RegistrationData) => {
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleUpdate = useCallback((updates: Partial<RegistrationData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      persist(next);
      return next;
    });
  }, [persist]);

  // ─── Role selection ────────────────────────────────────────────────────────
  const handleRoleSelect = (selectedRole: UserRole) => {
    const fresh = DEFAULT_DATA(selectedRole);
    setRole(selectedRole);
    setData(fresh);
    setRoleSelected(true);
    persist(fresh);
  };

  // ─── Step navigation ───────────────────────────────────────────────────────
  const steps = getSteps(role);
  const currentStep = data.currentStep;

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create account after BasicInfoStep
      setLoading(true);
      try {
        const { fullName, email, password } = data.basic;
        if (password) await storeRegister(fullName, email, password, role);
        handleUpdate({ currentStep: 1 });
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Registration failed. Email may already exist.');
      } finally {
        setLoading(false);
      }
      return;
    }
    handleUpdate({ currentStep: currentStep + 1 });
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      handleUpdate({ currentStep: currentStep - 1 });
    } else {
      // Back to role selection
      setRoleSelected(false);
      setData(DEFAULT_DATA(role));
      safeRemoveItem(STORAGE_KEY);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.patch(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        name: data.basic.fullName,
        phoneNumber: data.basic.phoneNumber,
        roleSpecific: data.roleSpecific,
        documents: data.documents,
        kycStatus: 'pending',
      });
      await safeRemoveItem(STORAGE_KEY);
      handleUpdate({ currentStep: currentStep + 1 });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Submission failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loaderText}>Loading…</Text>
      </View>
    );
  }

  // ─── Step 0: Role selection (no progress bar) ──────────────────────────────
  if (!roleSelected) {
    return <RoleSelectionStep onSelect={handleRoleSelect} />;
  }

  // ─── Registered steps ──────────────────────────────────────────────────────
  const isFinal = currentStep === steps.length - 1;
  const stepProps = { data, onUpdate: handleUpdate, onNext: handleNext, onPrev: handlePrev, onSubmit: handleSubmit, loading };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {!isFinal && <ProgressStepper currentStep={currentStep} steps={steps} />}
        <View style={styles.flex}>{renderStep(role, currentStep, stepProps)}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSteps(role: UserRole): string[] {
  const base = ['Credentials', 'Verify Email', 'Verify Phone'];
  switch (role) {
    case 'client':    return [...base, 'KYC Docs', 'Review', 'Done'];
    case 'engineer':  return [...base, 'Category', 'Profile', 'Documents', 'Review', 'Done'];
    case 'supervisor':return [...base, 'Category', 'License', 'Documents', 'Review', 'Done'];
    case 'supplier':  return [...base, 'Company', 'Catalog', 'Coverage', 'Location', 'Payments', 'Documents', 'Review', 'Done'];
    default:          return base;
  }
}

function renderStep(role: UserRole, step: number, props: any) {
  if (role === 'client') {
    const map: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      // 2: <PhoneVerificationStep {...props} />,
      3: <ClientKYSStep {...props} />,
      4: <ReviewSubmitStep {...props} />,
      5: <VerificationPendingStep />,
    };
    return map[step] ?? null;
  }
  if (role === 'engineer') {
    const isCompany = props.data.roleSpecific?.engineerType === 'company';
    const map: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      // 2: <PhoneVerificationStep {...props} />,
      3: <EngineerTypeStep {...props} />,
      4: isCompany ? <EngineeringCompanyStep {...props} /> : <IndividualEngineerStep {...props} />,
      5: <DocumentUploadStep {...props} />,
      6: <ReviewSubmitStep {...props} />,
      7: <VerificationPendingStep />,
    };
    return map[step] ?? null;
  }
  if (role === 'supervisor') {
    const isCompany = props.data.roleSpecific?.supervisorType === 'company';
    const map: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      // 2: <PhoneVerificationStep {...props} />,
      3: <SupervisorTypeStep {...props} />,
      4: isCompany ? <InspectionCompanyStep {...props} /> : <IndependentSupervisorStep {...props} />,
      5: <DocumentUploadStep {...props} />,
      6: <ReviewSubmitStep {...props} />,
      7: <VerificationPendingStep />,
    };
    return map[step] ?? null;
  }
  if (role === 'supplier') {
    const map: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      // 2: <PhoneVerificationStep {...props} />,
      3: <SupplierInfoStep {...props} />,
      4: <SupplierCategoriesStep {...props} />,
      5: <SupplierCoverageStep {...props} />,
      6: <SupplierLocationStep {...props} />,
      7: <SupplierPaymentStep {...props} />,
      8: <DocumentUploadStep {...props} />,
      9: <ReviewSubmitStep {...props} />,
      10: <VerificationPendingStep />,
    };
    return map[step] ?? null;
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
  loaderText: { marginTop: 12, fontSize: 14, color: COLORS.TEXT_SECONDARY },
});
