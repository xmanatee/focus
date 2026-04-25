import { TextInput, View } from 'react-native';
import { useThemeColors } from '../design/theme';

interface CodeInputProps {
  readonly length: number;
  readonly value: string;
  readonly onChange: (next: string) => void;
}

export function CodeInput({
  length,
  value,
  onChange,
}: CodeInputProps): JSX.Element {
  const colors = useThemeColors();
  return (
    <View className="bg-surface-sunken rounded-2xl px-4 py-4">
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.toUpperCase())}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        textContentType="oneTimeCode"
        maxLength={length}
        selectionColor={colors.signal}
        placeholder={'•'.repeat(length)}
        placeholderTextColor={colors.inkFaint}
        className="font-mono text-[26px] text-center"
        style={{ color: colors.ink, letterSpacing: 4 }}
      />
    </View>
  );
}
