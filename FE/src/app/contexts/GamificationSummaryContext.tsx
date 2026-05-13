import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchCurrentUserGamificationSummary,
  type GamificationSummary,
} from "../utils/gamification";

interface GamificationSummaryContextType {
  summary: GamificationSummary | null;
  isLoading: boolean;
  hasError: boolean;
  refreshSummary: () => Promise<GamificationSummary | null>;
}

const GamificationSummaryContext = createContext<GamificationSummaryContextType>({
  summary: null,
  isLoading: false,
  hasError: false,
  refreshSummary: async () => null,
});

export function GamificationSummaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const requestIdRef = useRef(0);

  const refreshSummary = useCallback(async () => {
    if (!user) {
      requestIdRef.current += 1;
      setSummary(null);
      setIsLoading(false);
      setHasError(false);
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setHasError(false);

    try {
      const nextSummary = await fetchCurrentUserGamificationSummary();
      if (requestIdRef.current === requestId) {
        setSummary(nextSummary);
      }

      return nextSummary;
    } catch {
      if (requestIdRef.current === requestId) {
        setHasError(true);
      }

      return null;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      requestIdRef.current += 1;
      setSummary(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    void refreshSummary();
  }, [refreshSummary, user]);

  return (
    <GamificationSummaryContext.Provider
      value={{
        summary,
        isLoading,
        hasError,
        refreshSummary,
      }}
    >
      {children}
    </GamificationSummaryContext.Provider>
  );
}

export function useGamificationSummary() {
  return useContext(GamificationSummaryContext);
}
