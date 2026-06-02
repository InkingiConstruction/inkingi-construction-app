import React, { useState } from 'react';
import { View, Text, Pressable, Image, Modal, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import DocumentUploader, { Document } from '../DocumentUploader';
import SelfieCamera from '../SelfieCamera';

interface ClientKYSStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ClientKYSStep({ data, onUpdate, onNext, onPrev }: ClientKYSStepProps) {
  const [idDoc, setIdDoc] = useState<Document | null>(
    data.documents?.find((d: any) => d.type === 'national_id') || null
  );
  const [selfieUri, setSelfieUri] = useState<string | null>(
    data.roleSpecific?.selfieUri || null
  );
  const [selfieUploaded, setSelfieUploaded] = useState<boolean>(
    data.roleSpecific?.selfieUploaded || false
  );
  
  const [cameraVisible, setCameraVisible] = useState(false);

  const handleIdUploadComplete = (doc: Document) => {
    setIdDoc(doc);
  };

  const handleIdDelete = () => {
    setIdDoc(null);
  };

  const handleSelfieCapture = async (uri: string) => {
    setSelfieUri(uri);
    setSelfieUploaded(false);

    // Simulate uploading selfie to backend/Cloudinary
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelfieUploaded(true);
    } catch (error) {
      console.error('Selfie upload error:', error);
      Alert.alert('Upload Failed', 'Selfie could not be uploaded, please retake.');
      setSelfieUri(null);
    }
  };

  const handleContinue = () => {
    if (!idDoc) {
      Alert.alert('Required Document', 'Please upload your National ID or Passport.');
      return;
    }
    if (!selfieUri || !selfieUploaded) {
      Alert.alert('Required Verification', 'Please complete the facial selfie verification.');
      return;
    }

    // Merge documents
    const docList = data.documents ? [...data.documents] : [];
    // Remove old national ID if existed
    const filteredDocs = docList.filter((d: any) => d.type !== 'national_id');
    filteredDocs.push(idDoc);

    onUpdate({
      documents: filteredDocs,
      roleSpecific: {
        ...data.roleSpecific,
        selfieUri,
        selfieUploaded: true,
      }
    });

    onNext();
  };

  const isValid = idDoc && selfieUri && selfieUploaded;

  return (
    <View style={styles.outerContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Back button */}
        <Pressable onPress={onPrev} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            InkingiPro requires identity validation to secure construction escrow deposits and contracts.
          </Text>
        </View>

        {/* 1. National ID Upload */}
        <DocumentUploader
          title="National ID or Passport"
          description="Upload a clear, well-lit photo of your government-issued ID card or Passport page."
          required={true}
          documentType="national_id"
          initialDocuments={idDoc ? [idDoc] : []}
          onUploadComplete={handleIdUploadComplete}
          onDelete={handleIdDelete}
        />

        {/* 2. Selfie Face Capture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Facial Selfie Verification <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            Take a live photo of yourself. This is compared with your ID card photo to prevent identity fraud.
          </Text>

          {selfieUri ? (
            <View style={styles.selfiePreviewCard}>
              <View style={styles.selfieImageContainer}>
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
                {!selfieUploaded && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.uploadingText}>Verifying selfie...</Text>
                  </View>
                )}
                {selfieUploaded && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.verifiedText}>Matched</Text>
                  </View>
                )}
              </View>

              <View style={styles.selfieControls}>
                <Text style={styles.successLabel}>Selfie Captured</Text>
                <Pressable style={styles.retakeBtn} onPress={() => setCameraVisible(true)}>
                  <Ionicons name="camera-reverse-outline" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.retakeText}>Retake Photo</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.captureButton} onPress={() => setCameraVisible(true)}>
              <Ionicons name="camera-outline" size={32} color={COLORS.PRIMARY} />
              <Text style={styles.captureButtonText}>Start Facial Capture</Text>
              <Text style={styles.captureButtonSubtext}>Opens front camera with face scanner guide</Text>
            </Pressable>
          )}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!isValid}
          style={[
            styles.submitBtn,
            isValid ? styles.submitBtnActive : styles.submitBtnDisabled
          ]}
        >
          <Text style={styles.submitBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>

      {/* Selfie Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" presentationStyle="fullScreen">
        <SelfieCamera
          onCapture={handleSelfieCapture}
          onClose={() => setCameraVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.SURFACE,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  required: {
    color: COLORS.ERROR,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
    lineHeight: 16,
  },
  captureButton: {
    height: 140,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  captureButtonSubtext: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
  },
  selfiePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 12,
  },
  selfieImageContainer: {
    width: 90,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.MUTED,
    position: 'relative',
    overflow: 'hidden',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  selfieControls: {
    flex: 1,
    gap: 10,
  },
  successLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retakeText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.MUTED,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
