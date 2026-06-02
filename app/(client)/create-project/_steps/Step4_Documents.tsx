// app/(client)/create-project/steps/Step4_Documents.tsx
/**
 * @fileoverview Step 4: Document uploads
 * Site photos (minimum 3) and architectural plans
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/colors';
import { ProjectData } from '..';
import { createStyles } from '@/utils/createStyles';

interface Step4Props {
  data: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface Document {
  uri: string;
  fileName: string;
  uploaded: boolean;
  url?: string;
  progress?: number;
}

export default function Step4_Documents({ data, onUpdate, onNext, onPrev }: Step4Props) {
  const [sitePhotos, setSitePhotos] = useState<Document[]>(data.documents.sitePhotos);
  const [architecturalPlans, setArchitecturalPlans] = useState<Document[]>(data.documents.architecturalPlans);
  const [uploading, setUploading] = useState(false);

  const pickImages = async (type: 'site' | 'plan') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: type === 'site',
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled) {
      const newDocuments = result.assets.map(asset => ({
        uri: asset.uri,
        fileName: asset.fileName || `${type}-${Date.now()}.jpg`,
        uploaded: false,
        progress: 0,
      }));

      if (type === 'site') {
        setSitePhotos([...sitePhotos, ...newDocuments]);
      } else {
        setArchitecturalPlans([...architecturalPlans, ...newDocuments]);
      }

      // Simulate upload (replace with actual Cloudinary upload)
      simulateUpload(newDocuments, type);
    }
  };

  const simulateUpload = async (documents: Document[], type: 'site' | 'plan') => {
    setUploading(true);
    
    for (const doc of documents) {
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (type === 'site') {
          setSitePhotos(prev =>
            prev.map(p => p.uri === doc.uri ? { ...p, progress } : p)
          );
        } else {
          setArchitecturalPlans(prev =>
            prev.map(p => p.uri === doc.uri ? { ...p, progress } : p)
          );
        }
      }
      
      // Mark as uploaded
      if (type === 'site') {
        setSitePhotos(prev =>
          prev.map(p => p.uri === doc.uri ? { ...p, uploaded: true, progress: 100 } : p)
        );
      } else {
        setArchitecturalPlans(prev =>
          prev.map(p => p.uri === doc.uri ? { ...p, uploaded: true, progress: 100 } : p)
        );
      }
    }
    
    setUploading(false);
  };

  const removeDocument = (type: 'site' | 'plan', uri: string) => {
    if (type === 'site') {
      setSitePhotos(prev => prev.filter(p => p.uri !== uri));
    } else {
      setArchitecturalPlans(prev => prev.filter(p => p.uri !== uri));
    }
  };

  const validateAndContinue = () => {
    if (sitePhotos.length < 3) {
      Alert.alert('Missing Photos', 'Please upload at least 3 site photos');
      return;
    }
    
    if (architecturalPlans.length === 0) {
      Alert.alert('Missing Plans', 'Please upload at least one architectural plan');
      return;
    }
    
    const allUploaded = [...sitePhotos, ...architecturalPlans].every(doc => doc.uploaded);
    if (!allUploaded) {
      Alert.alert('Uploads Pending', 'Please wait for all documents to finish uploading');
      return;
    }
    
    onUpdate({
      documents: {
        sitePhotos,
        architecturalPlans,
      },
    });
    
    onNext();
  };

  const handlePrev = () => {
    onUpdate({
      documents: {
        sitePhotos,
        architecturalPlans,
      },
    });
    onPrev();
  };

  return (
    <View style={{ padding: 24 }}>
      {/* Title */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
          Upload Documents
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
          Provide site photos and architectural plans
        </Text>
      </View>

      {/* Site Photos Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>
          Site Photos <Text style={{ color: COLORS.ERROR }}>* (Minimum 3)</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          Show different angles of the construction site
        </Text>
        
        <Pressable
          onPress={() => pickImages('site')}
          style={styles.uploadButton}
          disabled={uploading}
        >
          <Ionicons name="camera-outline" size={32} color={COLORS.PRIMARY} />
          <Text style={styles.uploadButtonText}>Add Site Photos</Text>
          <Text style={styles.uploadButtonSubtext}>JPG, PNG (Max 5MB each)</Text>
        </Pressable>
        
        {sitePhotos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
            {sitePhotos.map((photo, index) => (
              <View key={photo.uri} style={styles.imageContainer}>
                <Image source={{ uri: photo.uri }} style={styles.image} />
                {!photo.uploaded && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#FFF" />
                    <Text style={styles.uploadProgress}>{photo.progress}%</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => removeDocument('site', photo.uri)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.ERROR} />
                </Pressable>
                {photo.uploaded && (
                  <View style={styles.uploadedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
        
        <Text style={styles.counter}>
          {sitePhotos.length}/3 photos uploaded
        </Text>
      </View>

      {/* Architectural Plans Section */}
      <View style={{ marginBottom: 32 }}>
        <Text style={styles.sectionTitle}>
          Architectural Plans <Text style={{ color: COLORS.ERROR }}>*</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          Upload floor plans, elevations, or site plans
        </Text>
        
        <Pressable
          onPress={() => pickImages('plan')}
          style={styles.uploadButton}
          disabled={uploading}
        >
          <Ionicons name="document-text-outline" size={32} color={COLORS.PRIMARY} />
          <Text style={styles.uploadButtonText}>Add Plans</Text>
          <Text style={styles.uploadButtonSubtext}>PDF, DWG, JPG, PNG</Text>
        </Pressable>
        
        {architecturalPlans.map((plan, index) => (
          <View key={plan.uri} style={styles.planContainer}>
            <View style={styles.planInfo}>
              <Ionicons name="document-outline" size={24} color={COLORS.PRIMARY} />
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{plan.fileName}</Text>
                {!plan.uploaded && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${plan.progress}%` }]} />
                  </View>
                )}
              </View>
            </View>
            <Pressable onPress={() => removeDocument('plan', plan.uri)}>
              <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
            </Pressable>
          </View>
        ))}
      </View>

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
            (sitePhotos.length < 3 || architecturalPlans.length === 0) && styles.disabledButton,
          ]}
          disabled={sitePhotos.length < 3 || architecturalPlans.length === 0}
        >
          <Text style={styles.continueButtonText}>Review & Submit</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = createStyles({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
  },
  uploadButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    padding: 24,
    backgroundColor: COLORS.MUTED,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
  },
  imageList: {
    flexDirection: 'row',
    marginTop: 16,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgress: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  counter: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 8,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.MUTED,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  planInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planName: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  backButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
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
    paddingVertical: 14,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.MUTED,
  },
});