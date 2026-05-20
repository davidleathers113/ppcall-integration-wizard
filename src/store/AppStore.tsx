import React, { createContext, useReducer, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Campaign, Integration, TestRun, ActivityEvent } from '../models/appTypes';
import { MOCK_CAMPAIGNS, MOCK_INTEGRATIONS, MOCK_ACTIVITY } from '../data/mockData';

// --- State Definition ---
export interface AppState {
  campaigns: Campaign[];
  integrations: Integration[];
  testRuns: TestRun[];
  activityEvents: ActivityEvent[];
}

const initialState: AppState = {
  campaigns: MOCK_CAMPAIGNS,
  integrations: MOCK_INTEGRATIONS,
  testRuns: [],
  activityEvents: MOCK_ACTIVITY,
};

// --- Actions Definition ---
export type AppAction =
  | { type: 'CREATE_CAMPAIGN'; payload: Campaign }
  | { type: 'UPDATE_CAMPAIGN'; payload: Campaign }
  | { type: 'CREATE_INTEGRATION'; payload: Integration }
  | { type: 'UPDATE_INTEGRATION'; payload: Integration }
  | { type: 'RUN_TEST'; payload: { integrationId: string; testRun: TestRun } }
  | { type: 'ACTIVATE_INTEGRATION'; payload: string }
  | { type: 'PAUSE_INTEGRATION'; payload: string }
  | { type: 'ARCHIVE_INTEGRATION'; payload: string }
  | { type: 'BULK_IMPORT'; payload: Integration[] }
  | { type: 'MARK_USED'; payload: string }
  | { type: 'ADD_ACTIVITY'; payload: ActivityEvent }
  | { type: 'RESET_DATA' }
  | { type: 'HYDRATE'; payload: AppState };

// --- Reducer ---
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CREATE_CAMPAIGN':
      return { ...state, campaigns: [...state.campaigns, action.payload] };
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'CREATE_INTEGRATION':
      return { ...state, integrations: [...state.integrations, action.payload] };
    case 'UPDATE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map(i => i.id === action.payload.id ? action.payload : i)
      };
    case 'RUN_TEST':
      return {
        ...state,
        testRuns: [...state.testRuns, action.payload.testRun],
        integrations: state.integrations.map(i => {
          if (i.id === action.payload.integrationId) {
            return {
              ...i,
              lastTestedAt: new Date().toISOString(),
              lastSuccessfulTestAt: action.payload.testRun.status === 'passed' ? new Date().toISOString() : i.lastSuccessfulTestAt,
              status: action.payload.testRun.status === 'passed' ? (i.status === 'active' ? 'active' : 'test_passed') : 'failing'
            };
          }
          return i;
        })
      };
    case 'ACTIVATE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map(i => 
          i.id === action.payload ? { ...i, status: 'active', activatedAt: new Date().toISOString() } : i
        )
      };
    case 'PAUSE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map(i => 
          i.id === action.payload ? { ...i, status: 'paused' } : i
        )
      };
    case 'ARCHIVE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map(i => 
          i.id === action.payload ? { ...i, status: 'archived' } : i
        )
      };
    case 'BULK_IMPORT':
      return { ...state, integrations: [...state.integrations, ...action.payload] };
    case 'MARK_USED':
      return {
        ...state,
        integrations: state.integrations.map(i => 
          i.id === action.payload ? { ...i, usageCount: i.usageCount + 1, lastUsedAt: new Date().toISOString() } : i
        )
      };
    case 'ADD_ACTIVITY':
      return { ...state, activityEvents: [action.payload, ...state.activityEvents] };
    case 'RESET_DATA':
      return initialState;
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

// --- Context ---
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ppcall_studio_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.campaigns) {
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      } catch (e) {
        console.error("Failed to parse state from localStorage", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('ppcall_studio_state', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Custom Hook ---
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// --- Helper Functions to create activity easily ---
// eslint-disable-next-line react-refresh/only-export-components
export const createActivity = (integrationId: string, campaignId: string, eventType: ActivityEvent['eventType'], message: string, actor: string = "User"): ActivityEvent => ({
  id: `evt_${Math.random().toString(36).substr(2, 9)}`,
  integrationId,
  campaignId,
  eventType,
  message,
  createdAt: new Date().toISOString(),
  actor
});
