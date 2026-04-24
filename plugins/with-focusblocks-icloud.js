const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withFocusBlocksICloud(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.ubiquity-kvstore-identifier'] =
      '$(TeamIdentifierPrefix)$(CFBundleIdentifier)';
    mod.modResults['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.love.nemi.focus',
    ];
    mod.modResults['com.apple.developer.icloud-services'] = ['CloudKit'];

    // Some transitive deps inject aps-environment; our profile has no Push
    // capability, so leaving the key (even as undefined) fails codesign.
    // biome-ignore lint/performance/noDelete: must remove the key, not blank it
    delete mod.modResults['aps-environment'];

    return mod;
  });
};
