import { useState, useCallback } from "react";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Une erreur est survenue";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    execute,
    setError,
  };
};
