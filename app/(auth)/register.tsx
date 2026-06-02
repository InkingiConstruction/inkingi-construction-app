// app/(auth)/register/index.tsx
/**
 * @fileoverview Main registration orchestrator managing multi-step registration flow
 * Handles role-based registration with persistent progress storage
 *
 * @responsibility
 * - Manage multi-step registration wizard for all roles (client, engineer, supervisor, supplier)
 * - Persist registration progress to AsyncStorage
 * - Handle step navigation (next/back) with clickable progress stepper
 * - Orchestrate API calls for account creation and profile updates
 * - Render role-specific step components dynamically
 *
 * @features
 * - Clickable progress dots to navigate back to previous steps
 * - Auto-save progress to prevent data loss
 * - Role-specific step sequences
 * - Email and phone verification integration
 * - Document upload support
 *
 * @principles
 * - KISS: Simple step-based navigation with clear state management
 * - DRY: Centralized step rendering and navigation logic
 * - SOLID: Single responsibility for each function
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";

// Import progress stepper component
import ProgressStepper from "@/components/register/ProgressStepper";

// Import role selection step
import RoleSelectionStep from "@/components/register/steps/RoleSelectionStep";

// Import common steps
import BasicInfoStep from "@/components/register/steps/BasicInfoStep";
import EmailVerificationStep from "@/components/register/steps/EmailVerificationStep";
import PhoneVerificationStep from "@/components/register/steps/PhoneVerificationStep";
import DocumentUploadStep from "@/components/register/steps/DocumentUploadStep";
import ReviewSubmitStep from "@/components/register/steps/ReviewSubmitStep";
import VerificationPendingStep from "@/components/register/steps/VerificationPendingStep";

// Import client-specific steps
import ClientKYSStep from "@/components/register/steps/ClientKYSStep";

// Import engineer-specific steps
import EngineerTypeStep from "@/components/register/steps/EngineerTypeStep";
import IndividualEngineerStep from "@/components/register/steps/IndividualEngineerStep";
import EngineeringCompanyStep from "@/components/register/steps/EngineeringCompanyStep";

// Import supervisor-specific steps
import SupervisorTypeStep from "@/components/register/steps/SupervisorTypeStep";
import IndependentSupervisorStep from "@/components/register/steps/IndependentSupervisorStep";
import InspectionCompanyStep from "@/components/register/steps/InspectionCompanyStep";

// Import supplier-specific steps
import SupplierInfoStep from "@/components/register/steps/SupplierInfoStep";
import SupplierCategoriesStep from "@/components/register/steps/SupplierCategoriesStep";
import SupplierCoverageStep from "@/components/register/steps/SupplierCoverageStep";
import SupplierLocationStep from "@/components/register/steps/SupplierLocationStep";
import SupplierPaymentStep from "@/components/register/steps/SupplierPaymentStep";

// ============================================
// Type Definitions
// ============================================

export type UserRole = "client" | "engineer" | "supervisor" | "supplier";

/**
 * Registration data structure that persists across steps
 * Stores all user input during the registration process
 */
export interface RegistrationData {
  basic: {
    fullName: string;
    email: string;
    phoneNumber: string;
    country: string;
    password?: string;
    role: UserRole;
  };
  roleSpecific: any; // Role-specific data (varies by role)
  emailVerified: boolean;
  phoneVerified: boolean;
  documents: any[]; // Uploaded KYC documents
  currentStep: number;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "@inkingi_registration_data";

/**
 * Returns default registration data structure for a given role
 * @param role - User role (client, engineer, supervisor, supplier)
 * @returns Default RegistrationData object
 */
const DEFAULT_DATA = (role: UserRole = "client"): RegistrationData => ({
  basic: {
    fullName: "",
    email: "",
    phoneNumber: "",
    country: "Rwanda",
    role,
  },
  roleSpecific: {},
  emailVerified: false,
  phoneVerified: false,
  documents: [],
  currentStep: 0,
});

// ============================================
// AsyncStorage Helpers (with error handling)
// ============================================

/**
 * Safely get item from AsyncStorage (handles module not ready)
 * @param key - Storage key
 * @returns Stored value or null
 */
async function safeGetItem(key: string): Promise<string | null> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set item to AsyncStorage (handles module not ready)
 * @param key - Storage key
 * @param value - Value to store
 */
async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(key, value);
  } catch {
    /* Silently ignore - storage not available */
  }
}

/**
 * Safely remove item from AsyncStorage
 * @param key - Storage key
 */
async function safeRemoveItem(key: string): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.removeItem(key);
  } catch {
    /* Silently ignore */
  }
}

// ============================================
// Main Component
// ============================================

export default function RegisterFlow() {
  const params = useLocalSearchParams<{ role?: string }>();

  // State management
  const [roleSelected, setRoleSelected] = useState<boolean>(!!params.role);
  const [role, setRole] = useState<UserRole>(
    (params.role as UserRole) || "client",
  );
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [data, setData] = useState<RegistrationData>(
    DEFAULT_DATA((params.role as UserRole) || "client"),
  );

  // Store actions
  const storeRegister = useAuthStore((s) => s.register);

  // ============================================
  // Persistence Functions
  // ============================================

  /**
   * Persist current registration data to AsyncStorage
   * @param updated - Updated registration data
   */
  const persist = useCallback((updated: RegistrationData) => {
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  /**
   * Update registration data and persist changes
   * @param updates - Partial updates to apply
   */
  const handleUpdate = useCallback(
    (updates: Partial<RegistrationData>) => {
      setData((prev) => {
        const next = { ...prev, ...updates };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ============================================
  // Effects
  // ============================================

  /**
   * Load saved registration progress on mount
   */
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
        } catch {
          /* Corrupt data - start fresh */
        }
      }
      setIsReady(true);
    })();
  }, []);

  // ============================================
  // Navigation Handlers
  // ============================================

  /**
   * Handle role selection from the role selection screen
   * @param selectedRole - The role selected by the user
   */
  const handleRoleSelect = (selectedRole: UserRole) => {
    const fresh = DEFAULT_DATA(selectedRole);
    setRole(selectedRole);
    setData(fresh);
    setRoleSelected(true);
    persist(fresh);
  };

  /**
   * Handle click on progress stepper dots
   * Allows navigation back to previously completed steps only
   * @param stepIndex - Index of the step to navigate to
   */
 const handleStepPress = useCallback((stepIndex: number) => {
  // Only allow navigating to steps that are already completed
  if (stepIndex <= data.currentStep) {
    handleUpdate({ currentStep: stepIndex });
  }
}, [data.currentStep, handleUpdate]);

  /**
   * Navigate to the next step
   * Special handling for step 0 (creates account via API)
   */
  const handleNext = async () => {
    // Step 0: Create account after BasicInfoStep
    if (currentStep === 0) {
      setLoading(true);
      try {
        const { fullName, email, password } = data.basic;
        if (password) {
          await storeRegister(fullName, email, password, role);
        }
        handleUpdate({ currentStep: 1 });
      } catch (err: any) {
        alert(
          err?.response?.data?.message ||
            err?.message ||
            "Registration failed. Email may already exist.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }
    handleUpdate({ currentStep: currentStep + 1 });
  };

  /**
   * Navigate to the previous step
   * When at step 0, return to role selection
   */
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

  /**
   * Submit final registration data to server
   * Called from review step before showing pending screen
   */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.patch(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        name: data.basic.fullName,
        phoneNumber: data.basic.phoneNumber,
        roleSpecific: data.roleSpecific,
        documents: data.documents,
        kycStatus: "pending",
      });
      await safeRemoveItem(STORAGE_KEY);
      handleUpdate({ currentStep: currentStep + 1 });
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Submission failed. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Render Helpers
  // ============================================

  const steps = getSteps(role);
  const currentStep = data.currentStep;
  const isFinal = currentStep === steps.length - 1;

  // Props passed to all step components
  const stepProps = {
    data,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onPrev: handlePrev,
    onSubmit: handleSubmit,
    loading,
  };

  // Loading state
  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loaderText}>Loading…</Text>
      </View>
    );
  }

  // Role selection screen (fullscreen, no progress bar)
  if (!roleSelected) {
    return <RoleSelectionStep onSelect={handleRoleSelect} />;
  }

  // Main registration flow with progress stepper
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {/* Show ProgressStepper for all steps except the final "Done" page */}
        {!isFinal && (
          // Find where ProgressStepper is used and update it to:

          <ProgressStepper
            currentStep={currentStep} 
            steps={steps}
            onStepPress={handleStepPress}
            allowBackNavigation={true}
          />
        )}
        <View style={styles.flex}>
          {renderStep(role, currentStep, stepProps)}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the list of step names for a given role
 * @param role - User role
 * @returns Array of step name strings
 */
function getSteps(role: UserRole): string[] {
  const base = ["Credentials", "Verify Email"];

  switch (role) {
    case "client":
      return [...base, "KYC Docs", "Review", "Done"];
    case "engineer":
      return [...base, "Category", "Profile", "Documents", "Review", "Done"];
    case "supervisor":
      return [...base, "Category", "License", "Documents", "Review", "Done"];
    case "supplier":
      return [
        ...base,
        "Company",
        "Catalog",
        "Coverage",
        "Location",
        "Payments",
        "Documents",
        "Review",
        "Done",
      ];
    default:
      return base;
  }
}

/**
 * Dynamically render the appropriate step component based on role and step index
 * @param role - User role
 * @param step - Current step index
 * @param props - Props to pass to the step component
 * @returns React component or null
 */
function renderStep(
  role: UserRole,
  step: number,
  props: any,
): React.ReactElement | null {
  // Client flow
  if (role === "client") {
    const clientStepMap: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      // 2: <PhoneVerificationStep {...props} />,
      3: <ClientKYSStep {...props} />,
      4: <ReviewSubmitStep {...props} />,
      5: <VerificationPendingStep />,
    };
    return clientStepMap[step] ?? null;
  }

  // Engineer flow
  if (role === "engineer") {
    const isCompany = props.data.roleSpecific?.engineerType === "company";
    const engineerStepMap: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      2: <PhoneVerificationStep {...props} />,
      3: <EngineerTypeStep {...props} />,
      4: isCompany ? (
        <EngineeringCompanyStep {...props} />
      ) : (
        <IndividualEngineerStep {...props} />
      ),
      5: <DocumentUploadStep {...props} />,
      6: <ReviewSubmitStep {...props} />,
      7: <VerificationPendingStep />,
    };
    return engineerStepMap[step] ?? null;
  }

  // Supervisor flow
  if (role === "supervisor") {
    const isCompany = props.data.roleSpecific?.supervisorType === "company";
    const supervisorStepMap: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      2: <PhoneVerificationStep {...props} />,
      3: <SupervisorTypeStep {...props} />,
      4: isCompany ? (
        <InspectionCompanyStep {...props} />
      ) : (
        <IndependentSupervisorStep {...props} />
      ),
      5: <DocumentUploadStep {...props} />,
      6: <ReviewSubmitStep {...props} />,
      7: <VerificationPendingStep />,
    };
    return supervisorStepMap[step] ?? null;
  }

  // Supplier flow
  if (role === "supplier") {
    const supplierStepMap: Record<number, React.ReactElement | null> = {
      0: <BasicInfoStep {...props} />,
      1: <EmailVerificationStep {...props} />,
      2: <PhoneVerificationStep {...props} />,
      3: <SupplierInfoStep {...props} />,
      4: <SupplierCategoriesStep {...props} />,
      5: <SupplierCoverageStep {...props} />,
      6: <SupplierLocationStep {...props} />,
      7: <SupplierPaymentStep {...props} />,
      8: <DocumentUploadStep {...props} />,
      9: <ReviewSubmitStep {...props} />,
      10: <VerificationPendingStep />,
    };
    return supplierStepMap[step] ?? null;
  }

  return null;
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  flex: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
