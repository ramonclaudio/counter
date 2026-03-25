const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [/\.env\.convex\.local$/];

config.transformer.minifierConfig = {
  compress: {
    drop_console: ['log', 'info'],
  },
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

module.exports = config;
