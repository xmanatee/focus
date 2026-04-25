import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useDismiss(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);
}
