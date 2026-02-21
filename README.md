# ParkSpeak

Speech therapy app for people with Parkinson's disease. Built with React Native and Expo.

## What it does

ParkSpeak provides guided speech exercises targeting the common voice and articulation challenges in Parkinson's disease:

- **Phonation** - Sustained vowel sounds to build vocal strength
- **Reading** - Read-aloud sentences to practice projection and clarity
- **Articulation** - Tongue twisters and consonant-heavy phrases
- **Pitch variation** - Sentences with emphasis targets for intonation practice
- **Functional phrases** - Everyday expressions (ordering food, phone calls, etc.)

### Key features

- Real-time volume meter with visual feedback during recording
- Speech-to-text analysis via OpenAI Whisper API — compares what you said vs. the target
- Word-by-word accuracy breakdown with pronunciation tips
- Progress tracking with streaks, daily stats, and weekly/monthly charts
- Dynamic exercise generation via GPT (fresh sentences each session)
- Bilingual: English and Hebrew
- Large touch targets and high-contrast UI designed for accessibility

## Tech stack

- **React Native** 0.81 + **Expo SDK 54**
- **expo-router** for file-based navigation
- **expo-sqlite** for local progress database
- **expo-av** for audio recording
- **OpenAI API** for speech-to-text (Whisper) and exercise generation (GPT-4o-mini)
- **Zustand** for state management
- **i18next** for internationalization

## Getting started

### Prerequisites

- Node.js 18+
- Expo Go app on your phone, or a development build

### Install and run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

### Optional: OpenAI API key

For speech analysis and dynamic exercise generation, add your OpenAI API key in Settings within the app. The app works without it (static exercises, no speech scoring).

## Project structure

```
src/
  app/           # Expo Router screens (tabs, exercise, onboarding)
  components/    # UI components (audio, exercise, ui)
  constants/     # Theme, accessibility settings
  data/          # Static exercise content (JSON)
  hooks/         # Audio recorder, speech-to-text, volume meter
  i18n/          # Translation files (en, he)
  lib/           # Business logic (scoring, content, database, audio)
  store/         # Zustand stores (session, settings)
```

## License

Private - All rights reserved.
