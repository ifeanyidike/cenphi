import { useState, useCallback } from "react";

/**
 * Hook for managing loading states with simulated delay
 */
const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = useCallback(
    <T,>(callback: () => T, loadingTime = 600): Promise<T> => {
      setIsLoading(true);
      return new Promise<T>((resolve) => {
        setTimeout(() => {
          const result = callback();
          setIsLoading(false);
          resolve(result);
        }, loadingTime);
      });
    },
    []
  );

  return { isLoading, simulateLoading, setIsLoading };
};

export default useLoadingState;
