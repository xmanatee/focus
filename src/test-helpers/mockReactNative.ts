import React from 'react';
import { vi } from 'vitest';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('react-native', () => ({
  ActivityIndicator: (props: Record<string, unknown>) =>
    React.createElement('ActivityIndicator', props),
  Alert: {
    alert: vi.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  Pressable: ({ children, ...props }: MockProps) =>
    React.createElement('Pressable', props, children),
  ScrollView: ({ children, ...props }: MockProps) =>
    React.createElement('ScrollView', props, children),
  Switch: (props: Record<string, unknown>) =>
    React.createElement('Switch', props),
  TextInput: (props: Record<string, unknown>) =>
    React.createElement('TextInput', props),
  View: ({ children, ...props }: MockProps) =>
    React.createElement('View', props, children),
  useColorScheme: () => 'light',
}));
