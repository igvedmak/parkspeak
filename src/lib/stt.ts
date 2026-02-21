/**
 * Cloud Speech-to-Text using OpenAI Whisper API.
 * Accepts m4a, wav, mp3, webm, mp4, mpeg, mpga formats.
 */

import { Platform } from 'react-native';
import { LANGUAGES, resolveLanguage } from '../constants/languages';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

function getFileInfo(uri: string) {
  // Android records as .m4a, iOS as .m4a, web as .webm
  if (Platform.OS === 'web') {
    return { name: 'recording.webm', type: 'audio/webm' };
  }
  // Both Android and iOS now use M4A/AAC
  return { name: 'recording.m4a', type: 'audio/mp4' };
}

export async function transcribeAudio(
  fileUri: string,
  language: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Add it in Settings.');
  }

  const { name, type } = getFileInfo(fileUri);

  const formData = new FormData();

  // React Native's FormData can append a file URI directly
  formData.append('file', {
    uri: fileUri,
    type,
    name,
  } as unknown as Blob);

  formData.append('model', 'whisper-1');
  formData.append('language', LANGUAGES[resolveLanguage(language)].whisperCode);
  formData.append('response_format', 'text');

  console.log('[STT] Uploading audio...', { uri: fileUri, type, name, language });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] API error:', response.status, errorText);
      throw new Error(`Speech recognition failed (${response.status})`);
    }

    const text = await response.text();
    console.log('[STT] Result:', JSON.stringify(text.trim()));
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}
