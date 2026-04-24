import * as SecureStore from 'expo-secure-store';
import { convex } from '../../api/convex';

export interface PersistedAuthState {
  hasJwt: boolean;
  hasRefreshToken: boolean;
  hasVerifier: boolean;
  jwtSuffix: string | null;
}

const storageNamespace = convex.url.replace(/[^a-zA-Z0-9]/g, '');

const JWT_STORAGE_KEY = `__convexAuthJWT_${storageNamespace}`;
const REFRESH_TOKEN_STORAGE_KEY = `__convexAuthRefreshToken_${storageNamespace}`;
const VERIFIER_STORAGE_KEY = `__convexAuthOAuthVerifier_${storageNamespace}`;
const SERVER_STATE_FETCH_TIME_STORAGE_KEY = `__convexAuthServerStateFetchTime_${storageNamespace}`;

export async function readPersistedAuthState(): Promise<PersistedAuthState> {
  const [jwt, refreshToken, verifier] = await Promise.all([
    SecureStore.getItemAsync(JWT_STORAGE_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY),
    SecureStore.getItemAsync(VERIFIER_STORAGE_KEY),
  ]);

  return {
    hasJwt: jwt !== null,
    hasRefreshToken: refreshToken !== null,
    hasVerifier: verifier !== null,
    jwtSuffix: jwt === null ? null : jwt.slice(-12),
  };
}

export async function clearPersistedAuthState() {
  await Promise.all([
    SecureStore.deleteItemAsync(JWT_STORAGE_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY),
    SecureStore.deleteItemAsync(VERIFIER_STORAGE_KEY),
    SecureStore.deleteItemAsync(SERVER_STATE_FETCH_TIME_STORAGE_KEY),
  ]);
}
