import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface SelfieCameraProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export default function SelfieCamera({ onCapture, onClose }: SelfieCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.TEXT_LIGHT} />
        <Text style={styles.permissionText}>We need your permission to use the camera for selfie verification.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeButtonText} onPress={onClose}>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: '600' }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !loading) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          setPreviewUri(photo.uri);
        }
      } catch (error) {
        console.error('Take picture error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirm = () => {
    if (previewUri) {
      onCapture(previewUri);
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
  };

  return (
    <View style={styles.container}>
      {previewUri ? (
        // Preview State
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          
          <View style={styles.overlayTextContainer}>
            <Text style={styles.previewTitle}>Looks Good?</Text>
            <Text style={styles.previewSubtitle}>Ensure your face is clearly visible and not blurry</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.controlButton, styles.retakeBtn]} onPress={handleRetake}>
              <Ionicons name="refresh" size={24} color={COLORS.TEXT_PRIMARY} />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable style={[styles.controlButton, styles.confirmBtn]} onPress={handleConfirm}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Camera View State
        <CameraView
          style={styles.camera}
          facing="front"
          ref={cameraRef}
        >
          {/* Guide Overlay */}
          <View style={styles.maskContainer}>
            <View style={styles.maskTop} />
            <View style={styles.maskMiddleRow}>
              <View style={styles.maskSide} />
              <View style={styles.faceCutout}>
                {/* Oval Guide Border */}
                <View style={styles.faceGuideBorder} />
              </View>
              <View style={styles.maskSide} />
            </View>
            <View style={styles.maskBottom}>
              <Text style={styles.guideText}>Position your face within the oval</Text>
              <Text style={styles.guideSubText}>Ensure good lighting and remove glasses/hats</Text>
            </View>
          </View>

          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>

          {/* Shutter button */}
          <View style={styles.shutterContainer}>
            <Pressable style={styles.shutterButton} onPress={takePicture} disabled={loading}>
              <View style={styles.shutterInner} />
            </Pressable>
            {loading && <ActivityIndicator style={styles.spinner} size="large" color="#FFF" />}
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.BACKGROUND,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButtonText: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskMiddleRow: {
    height: 320,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  faceCutout: {
    width: 250,
    height: 320,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuideBorder: {
    width: 230,
    height: 290,
    borderRadius: 145,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_LIGHT,
    borderStyle: 'dashed',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  guideText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  guideSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  spinner: {
    position: 'absolute',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  overlayTextContainer: {
    marginTop: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'center',
    borderRadius: 16,
    width: '85%',
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  previewSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retakeBtn: {
    backgroundColor: '#FFF',
  },
  confirmBtn: {
    backgroundColor: COLORS.PRIMARY,
  },
  retakeText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
