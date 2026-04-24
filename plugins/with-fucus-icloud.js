const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Fucus iCloud Entitlements (Production Grade)
 *
 * This plugin serves as the single source of truth for iCloud configuration.
 * It replaces the buggy/incomplete defaults of 3rd party libraries.
 */
module.exports = function withFucusICloud(config) {
  return withEntitlementsPlist(config, (mod) => {
    // 1. Key-Value Storage
    // We use the $(TeamIdentifierPrefix) variable.
    // This is the "Gold Standard" because it works for BOTH local
    // "Team" profiles and "Production" App Store profiles without changes.
    mod.modResults['com.apple.developer.ubiquity-kvstore-identifier'] =
      '$(TeamIdentifierPrefix)$(CFBundleIdentifier)';

    // 2. iCloud Containers
    // Explicitly link the container you created in the Developer Portal.
    mod.modResults['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.com.yourbound.fucus',
    ];

    // 3. iCloud Services
    // Enable CloudKit services as required for modern syncing.
    mod.modResults['com.apple.developer.icloud-services'] = ['CloudKit'];

    // 4. Force Remove Push Notifications
    // Some libraries (like expo-notifications) automatically add this.
    // For this project, we ONLY use local notifications, so we MUST remove
    // this to avoid build errors with profiles that lack Push capabilities.
    delete mod.modResults['aps-environment'];

    return mod;
  });
};
