/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  CoachmarkFlowId,
  DEFAULT_USER_PREFERENCES,
  getNextCompletedFlows,
  fetchUserPreferences,
  updateUserPreferences as persistUserPreferences,
  UserPreferences,
} from "../utils/userPreferences";

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  hasFetched: boolean;
  errorMessage: string;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  markFlowCompleted: (flowId: CoachmarkFlowId) => Promise<void>;
  clearError: () => void;
}

const defaultContext: UserPreferencesContextType = {
  preferences: DEFAULT_USER_PREFERENCES,
  isLoading: false,
  hasFetched: false,
  errorMessage: "",
  updatePreferences: async () => DEFAULT_USER_PREFERENCES,
  markFlowCompleted: async () => {},
  clearError: () => {},
};

const UserPreferencesContext = createContext<UserPreferencesContextType>(defaultContext);

function normalizePreferences(preferences: Partial<UserPreferences>): UserPreferences {
  return {
    coachmarksEnabled: preferences.coachmarksEnabled ?? true,
    completedFlows: Array.from(new Set(preferences.completedFlows ?? [])) as CoachmarkFlowId[],
  };
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const latestPreferencesRef = useRef<UserPreferences>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    latestPreferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated || !user) {
      setPreferences(DEFAULT_USER_PREFERENCES);
      setIsLoading(false);
      setHasFetched(false);
      setErrorMessage("");
      return;
    }

    let isActive = true;

    const loadPreferences = async () => {
      setIsLoading(true);
      setHasFetched(false);
      setErrorMessage("");

      try {
        const loadedPreferences = await fetchUserPreferences();
        if (!isActive) {
          return;
        }

        setPreferences(loadedPreferences);
        setHasFetched(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPreferences(DEFAULT_USER_PREFERENCES);
        setErrorMessage(error instanceof Error ? error.message : "Unable to sync your hint preferences right now.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isInitializing, user]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const nextPreferences = normalizePreferences({
      ...latestPreferencesRef.current,
      ...updates,
      completedFlows: updates.completedFlows ?? latestPreferencesRef.current.completedFlows,
    });

    setPreferences(nextPreferences);
    setErrorMessage("");

    try {
      const savedPreferences = await persistUserPreferences(nextPreferences);
      setPreferences(savedPreferences);
      setHasFetched(true);
      return savedPreferences;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your hint preferences right now.");
      return nextPreferences;
    }
  }, []);

  const markFlowCompleted = useCallback(async (flowId: CoachmarkFlowId) => {
    const completedFlows = latestPreferencesRef.current.completedFlows;
    if (completedFlows.includes(flowId)) {
      return;
    }

    await updatePreferences({
      completedFlows: getNextCompletedFlows(completedFlows, flowId),
    });
  }, [updatePreferences]);

  const clearError = useCallback(() => {
    setErrorMessage("");
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        hasFetched,
        errorMessage,
        updatePreferences,
        markFlowCompleted,
        clearError,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}
