import React from 'react';
import { vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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
  FlatList: ({
    data,
    renderItem,
    keyExtractor,
    ListEmptyComponent,
    ...props
  }: MockProps) => {
    const render = renderItem as
      | ((args: {
          item: unknown;
          index: number;
          separators: object;
        }) => React.ReactNode)
      | undefined;
    const getKey = keyExtractor as
      | ((item: unknown, index: number) => string)
      | undefined;
    const children =
      Array.isArray(data) && data.length > 0 && render
        ? data.map((item, index) => {
            const child = render({ item, index, separators: {} });
            return React.isValidElement(child)
              ? React.cloneElement(child, {
                  key: getKey?.(item, index) ?? String(index),
                })
              : child;
          })
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
