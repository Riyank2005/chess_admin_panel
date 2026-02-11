pm import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useErrorRetry() {
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  const withRetry = useCallback(async (operation, options = {}) => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      onError,
      successMessage,
      errorMessage = 'Operation failed. Please try again.'
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetrying(true);
        const result = await operation();

        if (successMessage) {
          toast({
            title: "Success",
            description: successMessage,
            variant: "default",
          });
        }

        setRetrying(false);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Show retry toast
          toast({
            title: "Retrying...",
            description: `Attempt ${attempt} of ${maxRetries} failed. Retrying in ${retryDelay / 1000}s...`,
            variant: "default",
          });

          // Call onRetry callback if provided
          if (onRetry) {
            onRetry(attempt, error);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries failed
    setRetrying(false);

    const finalError = lastError || new Error('Operation failed after all retries');

    // Show error toast
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });

    // Call onError callback if provided
    if (onError) {
      onError(finalError);
    }

    throw finalError;
  }, [toast]);

  return { withRetry, retrying };
}
