import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
}: ButtonProps): JSX.Element {
  const baseClasses = 'py-4 rounded-2xl items-center justify-center flex-row';

  const variantClasses = {
    primary: 'bg-primary active:bg-blue-900',
    secondary: 'bg-gray-200 active:bg-gray-300',
    danger: 'bg-red-500 active:bg-red-700',
  };

  const textClasses = {
    primary: 'text-white font-bold text-lg',
    secondary: 'text-gray-900 font-semibold text-lg',
    danger: 'text-white font-bold text-lg',
  };

  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#111827' : '#FFFFFF'}
        />
      ) : (
        <Text className={textClasses[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
