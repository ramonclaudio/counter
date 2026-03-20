import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({ ...config, name: config.name ?? 'DreamSeeker', slug: config.slug ?? 'counter' });
