import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { appReducer, createInitialState, type AppAction, type AppState } from "./appReducer";

export const STORAGE_KEY = "ppcall_studio_state";
export const STORAGE_VERSION = 6;

interface PersistedState {
  version: number;
  state: AppState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function readPersistedState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialState();

  try {
    const parsed = JSON.parse(saved) as Partial<PersistedState> | AppState;
    if ("version" in parsed && parsed.version === STORAGE_VERSION && parsed.state) {
      return parsed.state;
    }
    return createInitialState();
  } catch (error) {
    console.error("Failed to parse state from localStorage", error);
    return createInitialState();
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const hydratedRef = useRef(false);
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    if (typeof localStorage === "undefined") return createInitialState();
    return readPersistedState();
  });

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
    }

    const persisted: PersistedState = {
      version: STORAGE_VERSION,
      state
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export type { AppAction, AppState };
