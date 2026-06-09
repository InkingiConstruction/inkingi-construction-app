import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { ProjectData } from "..";
import { createStyles } from "@/utils/createStyles";

interface Step2Props {
  data: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2_Budget({ data, onUpdate, onNext, onPrev }: Step2Props) {
  const [budget, setBudget] = useState({
    totalAmount: data.budget.totalAmount,
    currency: data.budget.currency,
    needsExpertEstimate: data.budget.needsExpertEstimate || false,
  });
  const [error, setError] = useState("");

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: budget.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const handleBudgetChange = (text: string) => {
    const amount = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    setBudget((prev) => ({ ...prev, totalAmount: amount, needsExpertEstimate: amount > 0 ? false : prev.needsExpertEstimate }));
    setError("");
  };

  const handleCurrencyToggle = () => {
    setBudget((prev) => ({
      ...prev,
      currency: prev.currency === "RWF" ? "USD" : "RWF",
    }));
  };

  const persistBudget = () => {
    onUpdate({ budget });
  };

  const validateAndContinue = () => {
    persistBudget();
    onNext();
  };

  const handlePrev = () => {
    persistBudget();
    onPrev();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="calculator-outline" size={24} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.title}>Set Project Budget</Text>
          <Text style={styles.subtitle}>
            Add a budget if you already know it, or let the Main Contractor prepare an expert estimate after scoping.
          </Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.label}>
            Available project budget <Text style={{ color: COLORS.TEXT_LIGHT }}>(optional)</Text>
          </Text>

          <View style={styles.amountRow}>
            <Pressable onPress={handleCurrencyToggle} style={styles.currencyButton}>
              <Text style={styles.currencyText}>{budget.currency}</Text>
              <Ionicons name="swap-vertical-outline" size={16} color={COLORS.PRIMARY} />
            </Pressable>

            <TextInput
              keyboardType="numeric"
              onChangeText={handleBudgetChange}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={styles.amountInput}
              value={budget.totalAmount ? String(budget.totalAmount) : ""}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={() => {
              setBudget((prev) => ({
                ...prev,
                totalAmount: prev.needsExpertEstimate ? prev.totalAmount : 0,
                needsExpertEstimate: !prev.needsExpertEstimate,
              }));
              setError("");
            }}
            style={styles.estimateRow}
          >
            <View style={[styles.checkbox, budget.needsExpertEstimate && styles.checkboxActive]}>
              {budget.needsExpertEstimate ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.estimateTitle}>I need an expert estimate</Text>
              <Text style={styles.estimateBody}>The Main Contractor will prepare the final budget from the BOQ.</Text>
            </View>
          </Pressable>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Budget status</Text>
            <Text style={styles.limitValue}>{budget.needsExpertEstimate || !budget.totalAmount ? "To be estimated" : formatMoney(budget.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.navigationButtons}>
          <Pressable onPress={handlePrev} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            onPress={validateAndContinue}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue to Location</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: {
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: 48,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  amountCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  label: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: "row",
    gap: 10,
  },
  currencyButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },
  currencyText: {
    color: COLORS.PRIMARY,
    fontSize: 15,
    fontWeight: "900",
  },
  amountInput: {
    backgroundColor: COLORS.MUTED,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  limitRow: {
    alignItems: "center",
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    padding: 12,
  },
  limitLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "800",
  },
  limitValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "900",
  },
  estimateRow: {
    alignItems: "center",
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 12,
  },
  checkbox: {
    alignItems: "center",
    borderColor: COLORS.BORDER,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  estimateTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900",
  },
  estimateBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    alignItems: "center",
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
  },
  backButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "900",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    flex: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
  },
  continueButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
});
