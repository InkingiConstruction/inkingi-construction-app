// app/(client)/payments/passcode-setup.tsx
/**
 * @fileoverview Passcode setup screen for financial transactions
 * User must set a 6-digit passcode to authorize payments
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { storePasscode } from '@/utils/SecurityUtils';

export default function PasscodeSetup() {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentCode = step === 'create' ? passcode : confirmPasscode;

  const handleKeyPress = (key: string) => {
    setError('');
    if (key === 'delete') {
      if (step === 'create') {
        setPasscode(prev => prev.slice(0, -1));
      } else {
        setConfirmPasscode(prev => prev.slice(0, -1));
      }
    } else {
      const code = step === 'create' ? passcode : confirmPasscode;
      if (code.length < 6) {
        const nextCode = code + key;
        if (step === 'create') {
          setPasscode(nextCode);
          if (nextCode.length === 6) {
            // Wait 250ms so user sees the last digit filled, then switch steps
            setTimeout(() => {
              setStep('confirm');
              setConfirmPasscode('');
              setError('');
            }, 250);
          }
        } else {
          setConfirmPasscode(nextCode);
          if (nextCode.length === 6) {
            setTimeout(() => {
              handleSubmit(nextCode);
            }, 250);
          }
        }
      }
    }
  };

  const handleSubmit = async (code: string) => {
    if (code !== passcode) {
      setError('Passcodes do not match. Please try again.');
      setConfirmPasscode('');
      return;
    }

    setLoading(true);
    try {
      await storePasscode(passcode);
      Alert.alert(
        'Success',
        'Your financial passcode has been set up. You will need this to authorize payments and view your balances.',
        [
          {
            text: 'Continue',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPasscode('');
      setError('');
    } else {
      router.back();
    }
  };

  const renderBoxes = () => {
    const boxes = [];
    const length = currentCode.length;
    for (let i = 0; i < 6; i++) {
      const isFilled = i < length;
      boxes.push(
        <View
          key={i}
          style={{
            width: 48,
            height: 52,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isFilled ? COLORS.PRIMARY : COLORS.BORDER,
            backgroundColor: isFilled ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 6,
            shadowColor: isFilled ? COLORS.PRIMARY : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: isFilled ? 1 : 0,
          }}
        >
          {isFilled && (
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.PRIMARY, marginTop: 4 }}>
              *
            </Text>
          )}
        </View>
      );
    }
    return <View style={{ flexDirection: 'row', justifyContent: 'center' }}>{boxes}</View>;
  };

  const renderKeypad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];
    return (
      <View style={{ width: '100%', marginTop: 'auto', paddingHorizontal: 12, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            rowGap: 16,
            columnGap: 24,
          }}
        >
          {keys.map((key, index) => {
            if (key === '') {
              return <View key={index} style={{ width: 72, height: 72 }} />;
            }
            if (key === 'delete') {
              return (
                <Pressable
                  key={index}
                  onPress={() => handleKeyPress(key)}
                  style={({ pressed }) => ({
                    width: 72,
                    height: 72,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 36,
                    backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
                  })}
                >
                  <Ionicons name="backspace-outline" size={26} color={COLORS.TEXT_PRIMARY} />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={index}
                onPress={() => handleKeyPress(key)}
                style={({ pressed }) => ({
                  width: 72,
                  height: 72,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 36,
                  backgroundColor: pressed ? COLORS.BORDER : COLORS.SURFACE,
                  borderWidth: 1,
                  borderColor: COLORS.BORDER_LIGHT,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                })}
              >
                <Text style={{ fontSize: 24, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>
                  {key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        {/* Header */}
        <View>
          <Pressable onPress={handleBack} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: COLORS.PRIMARY_LIGHT,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.PRIMARY} />
            </View>
            
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, textAlign: 'center' }}>
              {step === 'create' ? 'Set Transaction Passcode' : 'Confirm Passcode'}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }}>
              {step === 'create'
                ? 'Create a 6-digit passcode to authorize transactions and secure your balance.'
                : 'Please re-enter your 6-digit passcode to confirm.'}
            </Text>
          </View>
        </View>

        {/* Passcode Boxes & Error */}
        <View style={{ marginVertical: 24 }}>
          {renderBoxes()}
          
          {error ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: COLORS.ERROR, fontSize: 14, fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Custom Numeric Keypad */}
        {renderKeypad()}

        {/* Loading Overlay */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}