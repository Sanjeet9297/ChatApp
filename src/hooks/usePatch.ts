import { useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';

/**
 * Custom hook specifically for PATCH requests.
 */
export const usePatch = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = useCallback(async (url: string, body: any, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.patch(url, body, config);
      setData(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Error occurred during PATCH';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, patch };
};
