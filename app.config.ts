import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Counter',
  slug: 'counter',
  scheme: 'counter',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.rmncldyo.counter',
    infoPlist: {
      ...config.ios?.infoPlist,
      NSMicrophoneUsageDescription:
        'Counter uses the microphone for voice conversations with your AI deal advisor.',
    },
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
    'expo-secure-store',
    'expo-web-browser',
    '@livekit/react-native',
  ],
});
