import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { isValidRwandanPhone } from '@/store/auth.store';

interface BasicInfoStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  loading?: boolean;
}

export default function BasicInfoStep({ data, onUpdate, onNext, loading }: BasicInfoStepProps) {
  const [formData, setFormData] = useState({
    fullName: data.basic?.fullName || '',
    email: data.basic?.email || '',
    phoneNumber: data.basic?.phoneNumber || '',
    // country: data.basic?.country || 'Rwanda',
    password: data.basic?.password || '',
    confirmPassword: data.basic?.confirmPassword || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Real-time validation functions
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        return '';
        
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
        
      case 'phoneNumber':
        if (!value.trim()) return 'Phone number is required';
        if (!isValidRwandanPhone(value)) {
          return 'Invalid format. Use +250XXXXXXXXX (e.g., +250788123456)';
        }
        return '';
        
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        return '';
        
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
        
      default:
        return '';
    }
  };
  
  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const isFormValid = () => {
    const fields = ['fullName', 'email', 'phoneNumber', 'password', 'confirmPassword'];
    const hasErrors = fields.some(field => errors[field]);
    const hasEmpty = fields.some(field => !formData[field as keyof typeof formData]);
    return !hasErrors && !hasEmpty;
  };
  
  const handleContinue = () => {
    // Final validation
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }
    
    // Save to parent state
    onUpdate({
      basic: {
        ...data.basic,
        ...formData,
      },
    });
    
    onNext();
  };
  
  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { strength: 0, label: 'Enter password', color: COLORS.TEXT_LIGHT };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const strengthLevel = Math.min(strength, 4);
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#059669'];
    
    return {
      strength: strengthLevel,
      label: labels[strengthLevel - 1] || 'Weak',
      color: colors[strengthLevel - 1] || '#EF4444',
    };
  };
  
  const passwordStrength = getPasswordStrength();
  
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Create Account
        </Text>
        <Text style={styles.subtitle}>
          Please fill in your personal information
        </Text>
      </View>
      
      {/* Form Fields */}
      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.fullName ? styles.inputErrorBorder : null]}>
            <Ionicons name="person-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              editable={!loading}
            />
          </View>
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
        </View>
        
        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Email Address <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.email ? styles.inputErrorBorder : null]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              editable={!loading}
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>
        
        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Phone Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.phoneNumber ? styles.inputErrorBorder : null]}>
            <Ionicons name="call-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="+250788123456"
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              editable={!loading}
            />
          </View>
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
          <Text style={styles.hintText}>
            Format: +250XXXXXXXXX (e.g., +250788123456)
          </Text>
        </View>
        
        {/* Country */}
        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Country
          </Text>
          <View style={[styles.inputWrapper, styles.disabledWrapper]}>
            <Ionicons name="location-outline" size={20} color={COLORS.TEXT_LIGHT} style={styles.icon} />
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.country}
              editable={false}
            />
          </View>
        </View> */}
        
        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Password <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.password ? styles.inputErrorBorder : null]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={COLORS.TEXT_SECONDARY} 
              />
            </Pressable>
          </View>
          
          {/* Password strength indicator */}
          {formData.password && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarBg}>
                  <View style={[styles.strengthBarFill, {
                    width: `${(passwordStrength.strength / 4) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <Text style={styles.strengthHint}>
                Minimum 8 characters, 1 uppercase, 1 number
              </Text>
            </View>
          )}
          
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>
        
        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Confirm Password <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputErrorBorder : null]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              editable={!loading}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={COLORS.TEXT_SECONDARY} 
              />
            </Pressable>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>
      </View>
      
      {/* Continue Button */}
      <Pressable
        onPress={handleContinue}
        disabled={loading || !isFormValid()}
        style={[
          styles.submitBtn,
          isFormValid() ? styles.submitBtnActive : styles.submitBtnDisabled,
          loading ? styles.submitBtnLoading : null
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitBtnText}>
            Continue
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  required: {
    color: COLORS.ERROR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    paddingHorizontal: 14,
  },
  inputErrorBorder: {
    borderColor: COLORS.ERROR,
  },
  disabledWrapper: {
    backgroundColor: COLORS.MUTED,
    borderColor: COLORS.BORDER_LIGHT,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  disabledInput: {
    color: COLORS.TEXT_LIGHT,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    marginTop: 2,
  },
  hintText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    marginTop: 2,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.MUTED,
    borderRadius: 2,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthHint: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.MUTED,
  },
  submitBtnLoading: {
    opacity: 0.8,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
