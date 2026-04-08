import { useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';

/**
 * Custom hook specifically for GET requests.
 */
export const useGet = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async (url: string, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.get(url, config);
      setData(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Error occurred during GET';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, get };
};
