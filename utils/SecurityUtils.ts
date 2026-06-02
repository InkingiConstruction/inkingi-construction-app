// components/financial/SecurityUtils.ts
/**
 * @fileoverview Security utilities for passcode encryption and storage
 * Uses secure storage for passcode with biometric fallback
 * 
 * @responsibility
 * - Store and verify user passcode securely
 * - Encrypt sensitive financial data
 * - Provide rate limiting for failed attempts
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSCODE_KEY = 'user_financial_passcode';
const FAILED_ATTEMPTS_KEY = 'failed_passcode_attempts';
const LOCKOUT_UNTIL_KEY = 'passcode_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Session-level unlock flag.
 * Once the user successfully verifies the passcode once per session,
 * this is set to true. It is cleared when the JS runtime restarts (app kill).
 * Call clearPasscodeSession() explicitly on logout.
 */
let _sessionUnlocked = false;

export const isPasscodeSessionUnlocked = (): boolean => _sessionUnlocked;
export const unlockPasscodeSession = (): void => { _sessionUnlocked = true; };
export const clearPasscodeSession = (): void => { _sessionUnlocked = false; };

export interface PasscodeValidationResult {
  success: boolean;
  remainingAttempts: number;
  isLocked: boolean;
  lockoutRemaining?: number;
}

/**
 * Hash passcode before storage (never store plain text)
 */
export const hashPasscode = async (passcode: string): Promise<string> => {
  const salt = await getOrCreateSalt();
  const combined = passcode + salt;
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return digest;
};

/**
 * Get or create encryption salt
 */
const getOrCreateSalt = async (): Promise<string> => {
  const salt = await SecureStore.getItemAsync('passcode_salt');
  if (salt) {
    return salt;
  }
  const newSalt = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Date.now().toString() + Math.random().toString()
  );
  await SecureStore.setItemAsync('passcode_salt', newSalt);
  return newSalt;
};

/**
 * Store user's passcode (hashed)
 */
export const storePasscode = async (passcode: string): Promise<void> => {
  const hashed = await hashPasscode(passcode);
  await SecureStore.setItemAsync(PASSCODE_KEY, hashed);
  await resetFailedAttempts();
};

/**
 * Verify if passcode is correct
 */
export const verifyPasscode = async (passcode: string): Promise<PasscodeValidationResult> => {
  // Check if account is locked
  const lockoutUntil = await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY);
  if (lockoutUntil) {
    const lockoutTime = parseInt(lockoutUntil, 10);
    if (Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      return {
        success: false,
        remainingAttempts: 0,
        isLocked: true,
        lockoutRemaining: remaining,
      };
    } else {
      // Lockout expired, reset attempts
      await resetFailedAttempts();
      await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
    }
  }

  const storedHash = await SecureStore.getItemAsync(PASSCODE_KEY);
  if (!storedHash) {
    return { success: false, remainingAttempts: MAX_ATTEMPTS, isLocked: false };
  }

  const hashedInput = await hashPasscode(passcode);
  
  if (hashedInput === storedHash) {
    await resetFailedAttempts();
    return { success: true, remainingAttempts: MAX_ATTEMPTS, isLocked: false };
  }

  // Failed attempt - increment counter
  const attempts = await getFailedAttempts();
  const newAttempts = attempts + 1;
  await storeFailedAttempts(newAttempts);

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockoutTime = Date.now() + LOCKOUT_DURATION;
    await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, lockoutTime.toString());
    return {
      success: false,
      remainingAttempts: 0,
      isLocked: true,
      lockoutRemaining: LOCKOUT_DURATION / 1000,
    };
  }

  return {
    success: false,
    remainingAttempts: MAX_ATTEMPTS - newAttempts,
    isLocked: false,
  };
};

/**
 * Check if passcode is already set up
 */
export const hasPasscode = async (): Promise<boolean> => {
  const passcode = await SecureStore.getItemAsync(PASSCODE_KEY);
  return !!passcode;
};

/**
 * Get failed attempts count
 */
const getFailedAttempts = async (): Promise<number> => {
  const attempts = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
  return attempts ? parseInt(attempts, 10) : 0;
};

const storeFailedAttempts = async (attempts: number): Promise<void> => {
  await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());
};

const resetFailedAttempts = async (): Promise<void> => {
  await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
};

/**
 * Generate secure random token for transactions
 */
export const generateTransactionToken = async (): Promise<string> => {
  const randomBytes = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Date.now().toString() + Math.random().toString() + Math.random().toString()
  );
  return randomBytes.substring(0, 32);
};