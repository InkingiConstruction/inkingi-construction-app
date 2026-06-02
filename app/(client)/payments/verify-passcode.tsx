// app/(client)/payments/verify-passcode.tsx
/**
 * @fileoverview Passcode verification modal - centered design matching passcode-setup
 * Unlocks the session on first successful verify so repeat actions don't re-prompt.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import {
  verifyPasscode,
  PasscodeValidationResult,
  unlockPasscodeSession,
} from '@/utils/SecurityUtils';

interface VerifyPasscodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionType: 'deposit' | 'release' | 'withdraw' | 'unlock_balance';
  amount?: number;
}

export default function VerifyPasscodeModal({
  visible,
  onClose,
  onSuccess,
  actionType,
  amount,
}: VerifyPasscodeModalProps) {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (visible) {
      setPasscode('');
      setError('');
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    let timer: any;
    if (lockoutTimer > 0) {
      timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutTimer]);

  const handleSubmit = async (codeToSubmit: string) => {
    if (codeToSubmit.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const result: PasscodeValidationResult = await verifyPasscode(codeToSubmit);
      if (result.isLocked) {
        setIsLocked(true);
        setLockoutTimer(result.lockoutRemaining || 0);
        setError(`Account locked. Try again in ${result.lockoutRemaining}s`);
        setPasscode('');
      } else if (result.success) {
        unlockPasscodeSession();
        onSuccess();
        onClose();
      } else {
        setError(`Incorrect passcode. ${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} left`);
        setPasscode('');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isLocked || loading) return;
    setError('');
    if (key === 'delete') {
      setPasscode(prev => prev.slice(0, -1));
    } else if (passcode.length < 6) {
      const nextCode = passcode + key;
      setPasscode(nextCode);
      if (nextCode.length === 6) {
        setTimeout(() => handleSubmit(nextCode), 250);
      }
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'deposit': return 'Add Funds';
      case 'withdraw': return 'Withdraw Funds';
      case 'release': return 'Release Payment';
      case 'unlock_balance': return 'View Balance';
    }
  };

  const renderDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < passcode.length;
        return (
          <View
            key={i}
            style={{
              width: 48,
              height: 52,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: filled ? COLORS.PRIMARY : COLORS.BORDER,
              backgroundColor: filled ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: filled ? COLORS.PRIMARY : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: filled ? 2 : 0,
            }}
          >
            {filled && (
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.PRIMARY }}>•</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  const renderKeypad = () => (
    <View style={{ width: '100%', paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 14, columnGap: 24 }}>
        {keys.map((key, idx) => {
          if (key === '') return <View key={idx} style={{ width: 72, height: 72 }} />;
          if (key === 'delete') {
            return (
              <Pressable
                key={idx}
                onPress={() => handleKeyPress('delete')}
                style={({ pressed }) => ({
                  width: 72, height: 72,
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 36,
                  backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
                })}
              >
                <Ionicons name="backspace-outline" size={26} color={COLORS.TEXT_PRIMARY} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handleKeyPress(key)}
              disabled={isLocked || loading}
              style={({ pressed }) => ({
                width: 72, height: 72,
                alignItems: 'center', justifyContent: 'center',
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
              <Text style={{ fontSize: 24, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>{key}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: COLORS.BACKGROUND,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingBottom: 32,
            paddingHorizontal: 24,
            minHeight: 560,
          }}
        >
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.BORDER, alignSelf: 'center', marginBottom: 20 }} />

          {/* Close */}
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute', right: 20, top: 20,
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: COLORS.SURFACE,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: COLORS.BORDER_LIGHT,
            }}
          >
            <Ionicons name="close" size={18} color={COLORS.TEXT_SECONDARY} />
          </Pressable>

          {/* Icon + Title */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{
              width: 68, height: 68, borderRadius: 34,
              backgroundColor: COLORS.PRIMARY_LIGHT,
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.PRIMARY} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
              {getActionLabel()}
            </Text>
            {amount ? (
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.PRIMARY, marginTop: 4 }}>
                {amount.toLocaleString()} RWF
              </Text>
            ) : null}
            <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
              Enter your 6-digit passcode to{'\n'}authorize this action
            </Text>
          </View>

          {/* Dots */}
          <View style={{ marginBottom: 10 }}>
            {renderDots()}
            {error ? (
              <Text style={{ color: COLORS.ERROR, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 14 }}>
                {error}
              </Text>
            ) : <View style={{ height: 28 }} />}
          </View>

          {/* Keypad */}
          {renderKeypad()}

          {/* Forgot */}
          <Pressable
            onPress={() =>
              Alert.alert('Forgot Passcode?', 'Go to Settings → Security to change your passcode. Contact support if you are locked out.', [{ text: 'OK' }])
            }
            style={{ alignSelf: 'center', marginTop: 20 }}
          >
            <Text style={{ color: COLORS.PRIMARY, fontSize: 13, fontWeight: '600' }}>Forgot Passcode?</Text>
          </Pressable>
        </View>

        {/* Loading overlay */}
        {loading && (
          <View style={{
            ...StyleSheet_absolute,
            backgroundColor: 'rgba(0,0,0,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{ backgroundColor: COLORS.SURFACE, borderRadius: 20, padding: 24 }}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Small helper to avoid importing StyleSheet just for position absolute
const StyleSheet_absolute = {
  position: 'absolute' as const,
  top: 0, left: 0, right: 0, bottom: 0,
};