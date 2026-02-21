/**
 * Volume metering is now integrated into useAudioRecorder via expo-av's
 * isMeteringEnabled option. The recording status callback converts
 * dBFS values to linear RMS (0..1) and pushes them to useSessionStore.currentRms.
 *
 * The VolumeMeter component reads from the store directly.
 *
 * If we later need a standalone meter (without recording), we can implement
 * it here using react-native-audio-api's AnalyserNode.
 */
export {};
