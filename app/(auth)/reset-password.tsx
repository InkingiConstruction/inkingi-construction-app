// /app/(auth)/reset-password.tsx
/**
 * @fileoverview Reset password screen with OTP verification
 * Features: Auto-focus OTP input, automatic OTP completion detection, 
 * password strength validation, password confirmation
 * 
 * @responsibility
 * - Verify OTP code sent to user's email
 * - Allow user to set new password with confirmation
 * - Validate password strength
 * - Redirect to login on success
 * - Provide resend OTP functionality
 */

import React, { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

// OTP Input Component
const OTPInput = ({ 
  otp, 
  setOtp, 
  onComplete,
  loading 
}: { 
  otp: string; 
  setOtp: (value: string) => void; 
  onComplete?: () => void;
  loading: boolean;
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [localOtp, setLocalOtp] = useState(otp.split(''));

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) return;
    
    const newOtp = [...localOtp];
    newOtp[index] = text;
    setLocalOtp(newOtp);
    
    const otpString = newOtp.join('');
    setOtp(otpString);
    
    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if OTP is complete (6 digits)
    if (otpString.length === 6 && onComplete && !loading) {
      onComplete();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !localOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...localOtp];
      newOtp[index - 1] = '';
      setLocalOtp(newOtp);
      setOtp(newOtp.join(''));
    }
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 20 }}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          style={{
            width: 50,
            height: 60,
            backgroundColor: COLORS.MUTED,
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 'bold',
            color: COLORS.TEXT_PRIMARY,
            borderWidth: localOtp[index] ? 2 : 1,
            borderColor: localOtp[index] ? COLORS.PRIMARY : COLORS.BORDER,
          }}
          keyboardType="number-pad"
          maxLength={1}
          value={localOtp[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          editable={!loading}
        />
      ))}
    </View>
  );
};

// Password strength indicator
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: 'Enter password', color: COLORS.TEXT_LIGHT };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
      { level: 1, label: 'Weak', color: '#EF4444' },
      { level: 2, label: 'Fair', color: '#F59E0B' },
      { level: 3, label: 'Good', color: '#10B981' },
      { level: 4, label: 'Strong', color: '#059669' },
    ];
    
    const strength = Math.min(Math.floor(score / 2), 3);
    return levels[strength] || { level: 0, label: 'Weak', color: '#EF4444' };
  };
  
  const strength = getStrength();
  
  if (!password) return null;
  
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, height: 4, backgroundColor: COLORS.MUTED, borderRadius: 2 }}>
          <View style={{
            width: `${(strength.level / 3) * 100}%`,
            height: 4,
            backgroundColor: strength.color,
            borderRadius: 2,
          }} />
        </View>
        <Text style={{ fontSize: 12, color: strength.color }}>{strength.label}</Text>
      </View>
      <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, marginTop: 4 }}>
        Minimum 8 characters, 1 uppercase, 1 number
      </Text>
    </View>
  );
};

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      // First, verify the OTP
      await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        purpose: "password_reset",
      });
      
      setMessage("OTP verified successfully. Please set your new password.");
      setOtpStep(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password: newPassword,
      });
      
      Alert.alert(
        "Success",
        "Your password has been reset successfully. Please login with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setError("");
    setMessage("");
    
    try {
      await api.post(ENDPOINTS.AUTH.RESEND_OTP, {
        email: email.trim().toLowerCase(),
        purpose: "password_reset",
      });
      
      setMessage("A new verification code has been sent to your email");
      setCountdown(60); // 60 seconds cooldown
      setOtp("");
      setOtpStep(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  // Auto-submit OTP when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && otpStep && !loading) {
      handleVerifyOTP();
    }
  }, [otp]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                flex: 1,
                padding: 24,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => ({
                    padding: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
                </Pressable>
                <Ionicons name="key-outline" size={24} color={COLORS.PRIMARY} />
              </View>

              {/* Icon */}
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderRadius: 60,
                  height: 100,
                  justifyContent: "center",
                  marginBottom: 32,
                  width: 100,
                  alignSelf: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={48} color={COLORS.PRIMARY_DARK} />
              </View>

              {/* Title */}
              <Text
                style={{
                  color: COLORS.TEXT_PRIMARY,
                  fontSize: 28,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {otpStep ? "Verify Code" : "Reset Password"}
              </Text>
              <Text
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  fontSize: 14,
                  lineHeight: 20,
                  textAlign: "center",
                  marginTop: 8,
                  marginBottom: 24,
                }}
              >
                {otpStep 
                  ? `Enter the 6-digit code sent to ${email || 'your email'}`
                  : "Create a strong password for your account"
                }
              </Text>

              {otpStep ? (
                // OTP Verification Step
                <View>
                  {/* Email Input (readonly if provided) */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_SECONDARY, marginBottom: 8 }}>
                      Email Address
                    </Text>
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      style={{
                        backgroundColor: COLORS.MUTED,
                        borderRadius: 12,
                        color: COLORS.TEXT_PRIMARY,
                        padding: 14,
                        fontSize: 16,
                      }}
                      value={email}
                      editable={!params.email && !loading}
                    />
                  </View>

                  {/* OTP Input */}
                  <OTPInput 
                    otp={otp} 
                    setOtp={setOtp} 
                    onComplete={handleVerifyOTP}
                    loading={loading}
                  />

                  {/* Manual Verify Button (if auto-submit doesn't work) */}
                  {otp.length === 6 && (
                    <Pressable
                      onPress={handleVerifyOTP}
                      disabled={loading}
                      style={{
                        backgroundColor: COLORS.PRIMARY,
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginTop: 16,
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                          Verify Code
                        </Text>
                      )}
                    </Pressable>
                  )}

                  {/* Resend OTP */}
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Pressable
                      onPress={handleResendOTP}
                      disabled={resending || countdown > 0}
                      style={{ opacity: (resending || countdown > 0) ? 0.5 : 1 }}
                    >
                      <Text style={{ color: COLORS.PRIMARY, fontWeight: '600' }}>
                        {resending 
                          ? "Sending..." 
                          : countdown > 0 
                            ? `Resend code in ${countdown}s` 
                            : "Resend Code"
                        }
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                // New Password Step
                <View>
                  {/* New Password Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_SECONDARY, marginBottom: 8 }}>
                      New Password
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: COLORS.MUTED,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, paddingVertical: 14, fontSize: 16 }}
                        placeholder="Enter new password"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!loading}
                      />
                      <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons 
                          name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={COLORS.TEXT_SECONDARY} 
                        />
                      </Pressable>
                    </View>
                    <PasswordStrengthIndicator password={newPassword} />
                  </View>

                  {/* Confirm Password Input */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_SECONDARY, marginBottom: 8 }}>
                      Confirm Password
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: COLORS.MUTED,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, paddingVertical: 14, fontSize: 16 }}
                        placeholder="Confirm your password"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                      />
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={COLORS.TEXT_SECONDARY} 
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Reset Password Button */}
                  <Pressable
                    disabled={loading || !newPassword || !confirmPassword}
                    onPress={handleResetPassword}
                    style={{
                      backgroundColor: (newPassword && confirmPassword) ? COLORS.PRIMARY : COLORS.MUTED,
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                        Reset Password
                      </Text>
                    )}
                  </Pressable>

                  {/* Back to OTP */}
                  <Pressable
                    onPress={() => setOtpStep(true)}
                    style={{ alignItems: 'center', marginTop: 16 }}
                  >
                    <Text style={{ color: COLORS.TEXT_SECONDARY }}>
                      ← Back to verification
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Message / Error Display */}
              {message ? (
                <Text
                  style={{
                    color: COLORS.SUCCESS,
                    fontSize: 13,
                    fontWeight: "600",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  {message}
                </Text>
              ) : null}
              
              {error ? (
                <Text
                  style={{
                    color: COLORS.ERROR,
                    fontSize: 13,
                    fontWeight: "600",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  {error}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}