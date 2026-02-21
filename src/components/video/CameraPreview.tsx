import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { MouthFeedback } from './MouthFeedback';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import { useTranslation } from 'react-i18next';
import React from 'react';

// Lazy-load native modules
let VisionCamera: typeof import('react-native-vision-camera') | null = null;
let Mediapipe: typeof import('react-native-mediapipe') | null = null;

async function loadNativeModules() {
  if (!VisionCamera) {
    try {
      const mod = await import('react-native-vision-camera');
      if (!mod.Camera?.requestCameraPermission) {
        console.warn('[CameraPreview] VisionCamera native module not linked (Expo Go?)');
        return false;
      }
      VisionCamera = mod;
    } catch {
      console.warn('[CameraPreview] react-native-vision-camera not available');
      return false;
    }
  }
  if (!Mediapipe) {
    try {
      const mod = await import('react-native-mediapipe');
      if (!mod.useFaceLandmarkDetection) {
        console.warn('[CameraPreview] Mediapipe native module not linked (Expo Go?)');
        return false;
      }
      Mediapipe = mod;
    } catch {
      console.warn('[CameraPreview] react-native-mediapipe not available');
      return false;
    }
  }
  return true;
}

interface CameraPreviewProps {
  isRecording: boolean;
  onToggle: () => void;
}

export function CameraPreview({ isRecording, onToggle }: CameraPreviewProps) {
  const { t } = useTranslation();
  const { metrics, handleResults, handleError, modelName } = useFaceTracking();
  const [modulesReady, setModulesReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadNativeModules();
        if (!loaded) return;
        setModulesReady(true);

        const status = await VisionCamera!.Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      } catch (e) {
        console.warn('[CameraPreview] Init failed:', (e as Error).message);
      }
    })();
  }, []);

  if (!modulesReady || !hasPermission) {
    return (
      <View style={styles.placeholder}>
        <Pressable
          style={styles.toggleButton}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t('camera.disable')}
        >
          <Ionicons name="videocam-off-outline" size={20} color={colors.textSecondary} />
          <Typography variant="caption" color={colors.textSecondary}>
            {!modulesReady ? t('camera.notAvailable') : t('camera.noPermission')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <CameraView
      isRecording={isRecording}
      onToggle={onToggle}
      metrics={metrics}
      handleResults={handleResults}
      handleError={handleError}
      modelName={modelName}
    />
  );
}

// Separate component that only renders when modules are loaded
function CameraView({
  isRecording,
  onToggle,
  metrics,
  handleResults,
  handleError,
  modelName,
}: {
  isRecording: boolean;
  onToggle: () => void;
  metrics: ReturnType<typeof useFaceTracking>['metrics'];
  handleResults: ReturnType<typeof useFaceTracking>['handleResults'];
  handleError: ReturnType<typeof useFaceTracking>['handleError'];
  modelName: string;
}) {
  const { t } = useTranslation();
  const mp = Mediapipe!;
  const vc = VisionCamera!;
  const MediapipeCameraView = mp.MediapipeCamera;

  const onResultsCallback = useCallback(
    (result: any, _viewSize: any, _mirrored: boolean) => {
      handleResults(result);
    },
    [handleResults],
  );

  const faceLandmarkDetection = mp.useFaceLandmarkDetection(
    onResultsCallback,
    handleError,
    mp.RunningMode.LIVE_STREAM,
    modelName,
    {
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      delegate: mp.Delegate.GPU,
      mirrorMode: 'mirror-front-only',
    },
  );

  const device = vc.useCameraDevice('front');

  if (!device) {
    return (
      <View style={styles.placeholder}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('camera.noDevice')}
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <MediapipeCameraView
          style={styles.camera}
          solution={faceLandmarkDetection}
          activeCamera="front"
          resizeMode="cover"
        />
        <Pressable
          style={styles.closeButton}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t('camera.disable')}
        >
          <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
      {isRecording && <MouthFeedback metrics={metrics} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  cameraWrapper: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  camera: {
    flex: 1,
  },
  placeholder: {
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: accessibility.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
