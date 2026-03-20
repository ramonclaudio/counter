const { withXcodeProject } = require('@expo/config-plugins');

const withAutoSigning = (config) => {
  if (process.env.EAS_BUILD) return config;

  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    const targetName = xcodeProject.getFirstTarget()?.firstTarget?.name;
    if (!targetName) {
      console.warn('[with-auto-signing] Could not find main target');
      return config;
    }

    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();

    for (const key in buildConfigurations) {
      const buildConfig = buildConfigurations[key];

      if (
        buildConfig.buildSettings &&
        buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER
      ) {
        buildConfig.buildSettings.CODE_SIGN_STYLE = 'Automatic';

        if (config.ios?.appleTeamId) {
          buildConfig.buildSettings.DEVELOPMENT_TEAM = config.ios.appleTeamId;
        }

        delete buildConfig.buildSettings.PROVISIONING_PROFILE;
        delete buildConfig.buildSettings.PROVISIONING_PROFILE_SPECIFIER;
      }
    }

    return config;
  });
};

module.exports = withAutoSigning;
