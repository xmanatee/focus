import Constants from 'expo-constants';
import { Alert, Share, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { haptic } from '../../../shared/design/haptics';
import { errorMessage } from '../../../shared/errors';
import { buildDiagnosticsReport } from '../diagnostics';
import { useDiagnosticsSnapshot } from '../useDiagnosticsSnapshot';

function appVersion(): string {
  const version = Constants.expoConfig?.version;
  if (version === undefined) {
    throw new Error('Embedded app version is missing.');
  }
  return version;
}

export function DiagnosticsCard(): React.JSX.Element {
  const snapshot = useDiagnosticsSnapshot();

  const shareReport = async (): Promise<void> => {
    try {
      void haptic.select();
      const report = buildDiagnosticsReport({
        ...snapshot,
        appVersion: appVersion(),
        generatedAt: new Date(),
        now: new Date(),
      });
      await Share.share({
        message: report,
        title: 'Focus Blocks Diagnostics',
      });
    } catch (error) {
      Alert.alert('Could not share diagnostics', errorMessage(error));
    }
  };

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <Icon name="stethoscope" size={22} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="h3" tone="ink">
            Diagnostics
          </Typography>
          <Typography variant="body" tone="muted">
            Create a privacy-safe support report with setup status, rule counts,
            and native blocking state. It does not include app names, website
            names, or your block names.
          </Typography>
        </View>
      </View>
      <Button
        title="Share diagnostics"
        variant="ghost"
        onPress={() => void shareReport()}
      />
    </Card>
  );
}
