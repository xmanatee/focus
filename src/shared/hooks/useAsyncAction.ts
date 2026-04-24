import { useCallback, useState } from 'react';

interface AsyncAction {
  readonly error: string | null;
  readonly isPending: boolean;
  readonly run: (
    action: () => Promise<void>,
    fallbackMessage: string,
  ) => Promise<boolean>;
}

export function useAsyncAction(): AsyncAction {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async (action: () => Promise<void>, fallbackMessage: string) => {
      setError(null);
      setIsPending(true);
      try {
        await action();
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : fallbackMessage);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { error, isPending, run };
}
