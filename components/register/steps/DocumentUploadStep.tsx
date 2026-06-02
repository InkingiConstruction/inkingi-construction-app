import React, { useState } from 'react';
import { View, Text, Pressable, Image, Modal, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import DocumentUploader, { Document } from '../DocumentUploader';
import SelfieCamera from '../SelfieCamera';

interface DocumentUploadStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function DocumentUploadStep({ data, onUpdate, onNext, onPrev }: DocumentUploadStepProps) {
  const role = data.basic?.role;
  const isIndividual =
    data.roleSpecific?.engineerType === 'individual' ||
    data.roleSpecific?.supervisorType === 'independent';

  // State for selfie
  const [selfieUri, setSelfieUri] = useState<string | null>(
    data.roleSpecific?.selfieUri || null
  );
  const [selfieUploaded, setSelfieUploaded] = useState<boolean>(
    data.roleSpecific?.selfieUploaded || false
  );
  const [cameraVisible, setCameraVisible] = useState(false);

  // Determine what documents are required
  const getRequiredDocsList = () => {
    const list: Array<{ id: string; title: string; desc: string }> = [];

    // All individual roles need ID Card/Passport
    if (isIndividual || role === 'client') {
      list.push({
        id: 'national_id',
        title: 'National ID or Passport',
        desc: 'Clear copy of your government-issued ID/Passport.'
      });
    } else {
      // Corporate roles need Incorporation certificates
      list.push({
        id: 'rdb_certificate',
        title: 'RDB Incorporation Certificate',
        desc: 'Official Rwanda Development Board registration certificate.'
      });
    }

    // Role-specific certificates
    if (role === 'engineer') {
      if (isIndividual) {
        list.push({
          id: 'ier_certificate',
          title: 'IER Membership Certificate',
          desc: 'Current practicing certificate from the Institution of Engineers Rwanda.'
        });
      } else {
        list.push({
          id: 'ier_corporate_license',
          title: 'IER Corporate License',
          desc: 'Practicing certificate issued to your firm.'
        });
      }
    } else if (role === 'supervisor') {
      if (isIndividual) {
        list.push({
          id: 'practice_license',
          title: 'Certificate of Practice / License',
          desc: 'Safety inspection or supervisor quality license.'
        });
      } else {
        list.push({
          id: 'accreditation_cert',
          title: 'Accreditation/Quality Standard Certificate',
          desc: 'Proof of ISO or RSB quality management certification.'
        });
      }
    } else if (role === 'supplier') {
      list.push({
        id: 'tin_certificate',
        title: 'VAT/TIN Registration Certificate',
        desc: 'Rwanda Revenue Authority TIN assignment copy.'
      });
    }

    return list;
  };

  const requiredDocs = getRequiredDocsList();
  
  // Track uploaded documents in local state
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, Document>>(
    (data.documents || []).reduce((acc: any, doc: any) => {
      acc[doc.type] = doc;
      return acc;
    }, {})
  );

  const handleUploadComplete = (type: string, doc: Document) => {
    setUploadedDocs(prev => ({
      ...prev,
      [type]: doc
    }));
  };

  const handleUploadDelete = (type: string) => {
    setUploadedDocs(prev => {
      const copy = { ...prev };
      delete copy[type];
      return copy;
    });
  };

  const handleSelfieCapture = async (uri: string) => {
    setSelfieUri(uri);
    setSelfieUploaded(false);

    // Simulate upload of the selfie
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
    // Validate that all required docs are uploaded
    const missing = requiredDocs.filter(d => !uploadedDocs[d.id]);
    if (missing.length > 0) {
      Alert.alert('Missing Documents', `Please upload: ${missing.map(m => m.title).join(', ')}`);
      return;
    }

    if (!selfieUri || !selfieUploaded) {
      Alert.alert('Verification Needed', 'Please complete the facial selfie verification.');
      return;
    }

    // Convert local docs state map back to array
    const docList = Object.values(uploadedDocs);

    onUpdate({
      documents: docList,
      roleSpecific: {
        ...data.roleSpecific,
        selfieUri,
        selfieUploaded: true,
      }
    });

    onNext();
  };

  const allDocsUploaded = requiredDocs.every(d => uploadedDocs[d.id]);
  const isFormValid = allDocsUploaded && selfieUri && selfieUploaded;

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Pressable onPress={onPrev} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verification Documents</Text>
          <Text style={styles.subtitle}>
            Please upload the following required documents. Our review board verifies registration records before account activation.
          </Text>
        </View>

        {/* Dynamically Render Document Uploaders */}
        <View style={styles.uploadSection}>
          {requiredDocs.map((doc) => {
            const initialDoc = uploadedDocs[doc.id];
            return (
              <DocumentUploader
                key={doc.id}
                title={doc.title}
                description={doc.desc}
                required={true}
                documentType={doc.id}
                initialDocuments={initialDoc ? [initialDoc] : []}
                onUploadComplete={(uploaded) => handleUploadComplete(doc.id, uploaded)}
                onDelete={() => handleUploadDelete(doc.id)}
              />
            );
          })}
        </View>

        {/* Live Selfie Capture */}
        <View style={styles.selfieSection}>
          <Text style={styles.sectionTitle}>
            Facial Verification Selfie <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            Take a live face selfie. This is matched against ID card records to verify identity.
          </Text>

          {selfieUri ? (
            <View style={styles.selfiePreviewCard}>
              <View style={styles.selfieImageContainer}>
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
                {!selfieUploaded && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.uploadingText}>Uploading selfie...</Text>
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
              <Text style={styles.captureButtonText}>Start Face Scanner</Text>
              <Text style={styles.captureButtonSubtext}>Launches camera in selfie mode with face guide</Text>
            </Pressable>
          )}
        </View>

        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          disabled={!isFormValid}
          style={[
            styles.submitBtn,
            isFormValid ? styles.submitBtnActive : styles.submitBtnDisabled,
          ]}
        >
          <Text style={styles.submitBtnText}>Continue to Review</Text>
        </Pressable>
      </ScrollView>

      {/* Selfie Modal */}
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
  uploadSection: {
    marginBottom: 12,
  },
  selfieSection: {
    marginBottom: 28,
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
