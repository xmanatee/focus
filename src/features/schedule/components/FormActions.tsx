import { View } from 'react-native';
import { Button } from '../../../shared/components/Button';

interface FormActionsProps {
  readonly isEditing: boolean;
  readonly isPending: boolean;
  readonly readOnly: boolean;
  readonly onSave: () => void;
  readonly onDelete: () => void;
  readonly onCancel: () => void;
}

export function FormActions({
  isEditing,
  isPending,
  readOnly,
  onSave,
  onDelete,
  onCancel,
}: FormActionsProps): JSX.Element {
  if (readOnly) {
    return (
      <View className="gap-3">
        <Button title="Close" variant="commit" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Button
        title={isEditing ? 'Save changes' : 'Create block'}
        variant="commit"
        onPress={onSave}
        isLoading={isPending}
        disabled={isPending}
      />
      {isEditing && (
        <Button
          title="Delete block"
          variant="abandon"
          onPress={onDelete}
          disabled={isPending}
        />
      )}
      <Button
        title="Cancel"
        variant="ghost"
        onPress={onCancel}
        disabled={isPending}
      />
    </View>
  );
}
