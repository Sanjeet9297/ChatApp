import { useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';

/**
 * Custom hook specifically for PUT requests.
 */
export const usePut = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const put = useCallback(async (url: string, body: any, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.put(url, body, config);
      setData(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Error occurred during PUT';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, put };
};
