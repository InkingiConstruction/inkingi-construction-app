import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/colors';

export interface Document {
  id: string;
  type: string;
  uri: string;
  fileName: string;
  uploaded: boolean;
  progress?: number;
  url?: string;
}

interface DocumentUploaderProps {
  title: string;
  description?: string;
  required: boolean;
  documentType: string;
  acceptImages?: boolean;
  acceptCamera?: boolean;
  onUploadComplete: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  initialDocuments?: Document[];
  multiple?: boolean;
}

export default function DocumentUploader({
  title,
  description,
  required,
  documentType,
  acceptImages = true,
  acceptCamera = true,
  onUploadComplete,
  onDelete,
  initialDocuments = [],
  multiple = false,
}: DocumentUploaderProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  
  // Request camera and library permissions
  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'We need access to your camera and library to upload documents.'
      );
      return false;
    }
    return true;
  };
  
  // Open camera for capturing a document page
  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadDocument(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera launch error:', error);
      Alert.alert('Error', 'Could not open camera');
    }
  };
  
  // Open image picker
  const openImagePicker = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadDocument(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Could not open gallery');
    }
  };
  
  // Simulates or processes document uploading
  const uploadDocument = async (uri: string) => {
    setUploading(true);
    
    const documentId = Date.now().toString();
    const fileName = uri.split('/').pop() || `${documentType}_document.jpg`;
    
    const newDocument: Document = {
      id: documentId,
      type: documentType,
      uri,
      fileName,
      uploaded: false,
      progress: 0,
    };
    
    let updatedDocs = [];
    if (!multiple) {
      updatedDocs = [newDocument];
    } else {
      updatedDocs = [...documents, newDocument];
    }
    setDocuments(updatedDocs);
    
    try {
      // Simulate upload progress
      for (let i = 10; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === documentId ? { ...doc, progress: i } : doc
          )
        );
      }
      
      // Simulate successful Cloudinary/S3 url output
      const completedDocument = {
        ...newDocument,
        uploaded: true,
        progress: 100,
        url: `https://api.inkingipro.com/uploads/${documentId}_${fileName}`,
      };
      
      setDocuments(prev =>
        prev.map(doc => (doc.id === documentId ? completedDocument : doc))
      );
      
      onUploadComplete(completedDocument);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Please try again');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            if (onDelete) onDelete(documentId);
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {description && (
        <Text style={styles.description}>
          {description}
        </Text>
      )}
      
      {/* Upload Buttons */}
      <View style={styles.buttonRow}>
        {acceptCamera && (
          <Pressable onPress={openCamera} style={styles.uploadButton}>
            <Ionicons name="camera-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.uploadButtonText}>Take Photo</Text>
          </Pressable>
        )}
        
        {acceptImages && (
          <Pressable onPress={openImagePicker} style={styles.uploadButton}>
            <Ionicons name="images-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </Pressable>
        )}
      </View>
      
      {/* Document List */}
      {documents.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.previewContainer}>
            {documents.map((doc) => (
              <View key={doc.id} style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: doc.uri }} style={styles.image} />
                  
                  {/* Progress Overlay */}
                  {!doc.uploaded && doc.progress !== undefined && doc.progress < 100 && (
                    <View style={styles.progressOverlay}>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.progressText}>{doc.progress}%</Text>
                    </View>
                  )}
                  
                  {/* Delete Button */}
                  <Pressable onPress={() => handleDelete(doc.id)} style={styles.deleteButton}>
                    <Ionicons name="close-circle" size={22} color="#FFF" />
                  </Pressable>
                  
                  {/* Uploaded Badge */}
                  {doc.uploaded && (
                    <View style={styles.uploadedBadge}>
                      <Text style={styles.uploadedText}>Verified</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      
      {uploading && (
        <View style={styles.uploadingStatus}>
          <ActivityIndicator color={COLORS.PRIMARY} size="small" />
          <Text style={styles.uploadingStatusText}>Processing attachment...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: COLORS.SURFACE,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  required: {
    color: COLORS.ERROR,
  },
  description: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.BORDER,
  },
  uploadButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
    fontSize: 13,
  },
  scrollView: {
    marginTop: 12,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    width: 100,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 100,
    backgroundColor: COLORS.MUTED,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 11,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  uploadedText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardFooter: {
    padding: 6,
  },
  fileName: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  uploadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  uploadingStatusText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});
