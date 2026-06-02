// app/(client)/create-project/steps/Step2_Budget.tsx
/**
 * @fileoverview Step 2: Budget configuration with visual chart
 * Shows budget breakdown preview with pie/bar charts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { COLORS } from '@/constants/colors';
import { ProjectData } from '..';
import { createStyles } from '@/utils/createStyles';

const { width } = Dimensions.get('window');

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
  });
  const [error, setError] = useState('');

  // Suggested budget breakdown based on project category
  const getBudgetBreakdown = () => {
    const total = budget.totalAmount || 0;
    const category = data.basic.category;
    
    let design = 0.15;
    let construction = 0.60;
    let finishing = 0.25;
    
    if (category === 'commercial') {
      design = 0.20;
      construction = 0.55;
      finishing = 0.25;
    } else if (category === 'industrial') {
      design = 0.10;
      construction = 0.70;
      finishing = 0.20;
    } else if (category === 'infrastructure') {
      design = 0.25;
      construction = 0.60;
      finishing = 0.15;
    }
    
    return {
      design: total * design,
      construction: total * construction,
      finishing: total * finishing,
    };
  };

  const breakdown = getBudgetBreakdown();

  // Prepare data for pie chart
  const pieData = [
    { value: breakdown.design, color: '#3B82F6', label: 'Design', text: 'Design' },
    { value: breakdown.construction, color: '#10B981', label: 'Construction', text: 'Construction' },
    { value: breakdown.finishing, color: '#F59E0B', label: 'Finishing', text: 'Finishing' },
  ];

  // Prepare data for bar chart
  const barData = [
    { value: breakdown.design, label: 'Design', frontColor: '#3B82F6' },
    { value: breakdown.construction, label: 'Construction', frontColor: '#10B981' },
    { value: breakdown.finishing, label: 'Finishing', frontColor: '#F59E0B' },
  ];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: budget.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleBudgetChange = (text: string) => {
    const cleanNumber = text.replace(/[^0-9]/g, '');
    const amount = parseInt(cleanNumber, 10) || 0;
    
    setBudget(prev => ({ ...prev, totalAmount: amount }));
    setError('');
  };

  const validateAndContinue = () => {
    if (!budget.totalAmount || budget.totalAmount < 100000) {
      setError('Minimum budget is 100,000 RWF');
      Alert.alert('Invalid Budget', 'Minimum budget for a project is 100,000 RWF');
      return;
    }
    
    onUpdate({ budget });
    onNext();
  };

  const handlePrev = () => {
    onUpdate({ budget });
    onPrev();
  };

  return (
    <View style={{ padding: 24 }}>
      {/* Title */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
          Set Your Budget
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
          Define the total project budget and see the breakdown
        </Text>
      </View>

      {/* Budget Input */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.label}>
          Total Budget <Text style={{ color: COLORS.ERROR }}>*</Text>
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Currency Selector */}
          <Pressable
            onPress={() => setBudget(prev => ({ 
              ...prev, 
              currency: prev.currency === 'RWF' ? 'USD' : 'RWF' 
            }))}
            style={styles.currencyButton}
          >
            <Text style={styles.currencyText}>{budget.currency}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          
          {/* Amount Input */}
          <View style={styles.budgetInputContainer}>
            <TextInput
              style={styles.budgetInput}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType="numeric"
              value={budget.totalAmount.toString()}
              onChangeText={handleBudgetChange}
            />
          </View>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Text style={styles.helperText}>
          Minimum budget: {budget.currency === 'RWF' ? '100,000 RWF' : '$70 USD'}
        </Text>
      </View>

      {/* Budget Breakdown Section */}
      {budget.totalAmount > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Budget Breakdown</Text>
          </View>
          
          {/* Charts */}
          <View style={styles.chartsContainer}>
            {/* Pie Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Distribution</Text>
              <PieChart
                data={pieData}
                donut
                showGradient
                sectionAutoFocus
                radius={100}
                innerRadius={60}
                innerCircleColor={COLORS.SURFACE}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
                      {formatMoney(budget.totalAmount)}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY }}>
                      Total
                    </Text>
                  </View>
                )}
              />
            </View>
            
            {/* Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>By Category</Text>
              <BarChart
                data={barData}
                width={width - 100}
                height={200}
                barWidth={50}
                spacing={30}
                roundedTop
                showGradient
                frontColor="#10B981"
                yAxisTextStyle={{ color: COLORS.TEXT_SECONDARY }}
                xAxisLabelTextStyle={{ color: COLORS.TEXT_SECONDARY }}
              />
            </View>
          </View>
          
          {/* Detailed Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Detailed Breakdown</Text>
            
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <View style={[styles.colorDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.breakdownLabelText}>Design & Planning</Text>
              </View>
              <Text style={styles.breakdownValue}>{formatMoney(breakdown.design)}</Text>
              <Text style={styles.breakdownPercent}>
                ({((breakdown.design / budget.totalAmount) * 100).toFixed(0)}%)
              </Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.breakdownLabelText}>Construction</Text>
              </View>
              <Text style={styles.breakdownValue}>{formatMoney(breakdown.construction)}</Text>
              <Text style={styles.breakdownPercent}>
                ({((breakdown.construction / budget.totalAmount) * 100).toFixed(0)}%)
              </Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.breakdownLabelText}>Finishing</Text>
              </View>
              <Text style={styles.breakdownValue}>{formatMoney(breakdown.finishing)}</Text>
              <Text style={styles.breakdownPercent}>
                ({((breakdown.finishing / budget.totalAmount) * 100).toFixed(0)}%)
              </Text>
            </View>
          </View>
          
          {/* Escrow Info */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.PRIMARY} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Escrow Protection</Text>
              <Text style={styles.infoText}>
                Funds are held securely in escrow. You only release payment when milestones are completed.
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <Pressable onPress={handlePrev} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        
        <Pressable
          onPress={validateAndContinue}
          style={[
            styles.continueButton,
            !budget.totalAmount && styles.disabledButton,
          ]}
          disabled={!budget.totalAmount}
        >
          <Text style={styles.continueButtonText}>Continue to Location</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
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
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  budgetInputContainer: {
    flex: 1,
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  budgetInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  chartsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabelText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  breakdownPercent: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    marginTop: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  backButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.MUTED,
  },
});