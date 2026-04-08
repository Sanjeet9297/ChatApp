import { useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';

/**
 * Custom hook specifically for DELETE requests.
 */
export const useDelete = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const del = useCallback(async (url: string, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.delete(url, config);
      setData(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Error occurred during DELETE';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, del };
};
