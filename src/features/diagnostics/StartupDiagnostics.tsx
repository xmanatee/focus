import { useAuthToken } from '@convex-dev/auth/react';
import type { ConnectionState } from 'convex/browser';
import { useConvexConnectionState } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  clearPersistedAuthState,
  readPersistedAuthState,
} from '../auth/storage';
import { useRuntimeLogs } from './runtimeLogs';
import { Button } from '../../shared/components/Button';
import { Typography } from '../../shared/components/Typography';
import { convex } from '../../api/convex';

interface StartupDiagnosticsProps {
  blockerInitializationError: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  navigationReady: boolean;
  onResetSession: () => Promise<void>;
  route: string;
}

interface PersistedAuthStateSnapshot {
  hasJwt: boolean;
  hasRefreshToken: boolean;
  hasVerifier: boolean;
  jwtSuffix: string | null;
}

function connectionSummary(state: ConnectionState) {
  return [
    `wsConnected=${state.isWebSocketConnected}`,
    `hasEverConnected=${state.hasEverConnected}`,
    `retries=${state.connectionRetries}`,
    `inflight=${state.hasInflightRequests}`,
  ].join(' ');
}

export function StartupDiagnostics({
  blockerInitializationError,
  isAuthenticated,
  isLoading,
  navigationReady,
  onResetSession,
  route,
}: StartupDiagnosticsProps) {
  const authToken = useAuthToken();
  const connectionState = useConvexConnectionState();
  const runtimeLogs = useRuntimeLogs();
  const [persistedAuthState, setPersistedAuthState] =
    useState<PersistedAuthStateSnapshot | null>(null);
  const [isResettingSession, setIsResettingSession] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    void readPersistedAuthState().then(setPersistedAuthState);
  }, []);

  const diagnosis = useMemo(() => {
    if (!navigationReady) {
      return 'Root navigation has not finished mounting yet.';
    }

    if (
      authToken !== null &&
      !connectionState.hasEverConnected &&
      !connectionState.isWebSocketConnected
    ) {
      return 'Cached auth token is present, but Convex has not confirmed any connection yet.';
    }

    if (authToken === null && isLoading) {
      return 'Auth is still loading even though there is no cached token.';
    }

    if (blockerInitializationError) {
      return blockerInitializationError;
    }

    return 'Startup is waiting for Convex auth confirmation.';
  }, [
    authToken,
    blockerInitializationError,
    connectionState.hasEverConnected,
    connectionState.isWebSocketConnected,
    isLoading,
    navigationReady,
  ]);

  const handleResetSession = async () => {
    setResetError(null);
    setIsResettingSession(true);
    try {
      convex.clearAuth();
      await clearPersistedAuthState();
      await onResetSession();
      setPersistedAuthState(await readPersistedAuthState());
    } catch (error) {
      setResetError(
        error instanceof Error ? error.message : 'Could not reset session.',
      );
    } finally {
      setIsResettingSession(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View className="gap-2">
        <Typography variant="h3">Startup Diagnostics</Typography>
        <Typography variant="caption" className="text-textMuted">
          {diagnosis}
        </Typography>
      </View>

      <View className="rounded-2xl border border-gray-200 bg-surface p-4">
        <Typography variant="caption">route={route || '(root)'}</Typography>
        <Typography variant="caption">
          navigationReady={String(navigationReady)}
        </Typography>
        <Typography variant="caption">authLoading={String(isLoading)}</Typography>
        <Typography variant="caption">
          authAuthenticated={String(isAuthenticated)}
        </Typography>
        <Typography variant="caption">
          authTokenInContext={authToken === null ? 'no' : 'yes'}
        </Typography>
        <Typography variant="caption">
          convex={connectionSummary(connectionState)}
        </Typography>
        <Typography variant="caption">
          blockerError={blockerInitializationError ?? 'none'}
        </Typography>
        <Typography variant="caption">
          storedJwt={persistedAuthState?.hasJwt ? 'yes' : 'no'}
          {persistedAuthState?.jwtSuffix
            ? ` (${persistedAuthState.jwtSuffix})`
            : ''}
        </Typography>
        <Typography variant="caption">
          storedRefresh={persistedAuthState?.hasRefreshToken ? 'yes' : 'no'}
        </Typography>
        <Typography variant="caption">
          storedVerifier={persistedAuthState?.hasVerifier ? 'yes' : 'no'}
        </Typography>
      </View>

      <View className="gap-3">
        <Button
          title="Reset Cached Session"
          variant="danger"
          onPress={() => void handleResetSession()}
          isLoading={isResettingSession}
          disabled={isResettingSession}
        />
        {resetError ? (
          <Typography variant="caption" className="text-red-600">
            {resetError}
          </Typography>
        ) : null}
      </View>

      <View className="rounded-2xl border border-gray-200 bg-surface p-4">
        <Typography variant="h3">Runtime Logs</Typography>
        <View className="mt-3 gap-2">
          {runtimeLogs.length === 0 ? (
            <Typography variant="caption" className="text-textMuted">
              No runtime logs recorded yet.
            </Typography>
          ) : (
            runtimeLogs.slice(-12).map((entry) => (
              <Typography
                key={entry.id}
                variant="caption"
                className="text-text"
              >
                [{entry.level}] {entry.message}
              </Typography>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
