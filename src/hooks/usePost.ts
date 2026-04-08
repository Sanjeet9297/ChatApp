import { useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';

/**
 * Custom hook specifically for POST requests.
 */
export const usePost = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(async (url: string, body: any, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.post(url, body, config);
      setData(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Error occurred during POST';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, post };
};
