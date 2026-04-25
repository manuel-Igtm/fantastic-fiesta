import { useEffect, useState } from 'react';

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useQuery<T>(queryFn: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void run();
    // deps controls when query should refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    isLoading,
    error,
    refetch: run
  };
}
