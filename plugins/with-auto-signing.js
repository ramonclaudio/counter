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

    // Set CODE_SIGN_STYLE and DEVELOPMENT_TEAM on build configurations
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

    // Set ProvisioningStyle in project-level TargetAttributes
    const projectSection = xcodeProject.pbxProjectSection();
    for (const key in projectSection) {
      const project = projectSection[key];
      if (project.attributes && project.attributes.TargetAttributes) {
        for (const targetId in project.attributes.TargetAttributes) {
          project.attributes.TargetAttributes[targetId].ProvisioningStyle = 'Automatic';
          if (config.ios?.appleTeamId) {
            project.attributes.TargetAttributes[targetId].DevelopmentTeam = config.ios.appleTeamId;
          }
        }
      }
    }

    return config;
  });
};

module.exports = withAutoSigning;
