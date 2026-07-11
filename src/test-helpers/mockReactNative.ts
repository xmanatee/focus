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
  AppState: {
    addEventListener: () => ({ remove: vi.fn() }),
  },
  FlatList: ({ data, renderItem, ListEmptyComponent, ...props }: MockProps) => {
    const render = renderItem as
      | ((args: {
          item: unknown;
          index: number;
          separators: object;
        }) => React.ReactNode)
      | undefined;
    const children =
      Array.isArray(data) && data.length > 0 && render
        ? data.map((item, index) => render({ item, index, separators: {} }))
        : (ListEmptyComponent as React.ReactNode);
    return React.createElement('FlatList', props, children);
  },
  Modal: ({ children, ...props }: MockProps) =>
    React.createElement('Modal', props, children),
  NativeModules: {},
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
