import type { ActivityEvent, Campaign, Integration, TestRun } from "../models/appTypes";
import { MOCK_ACTIVITY, MOCK_CAMPAIGNS, MOCK_INTEGRATIONS } from "../data/mockData";

export interface AppState {
  campaigns: Campaign[];
  integrations: Integration[];
  testRuns: TestRun[];
  activityEvents: ActivityEvent[];
}

export const createInitialState = (): AppState => ({
  campaigns: MOCK_CAMPAIGNS,
  integrations: MOCK_INTEGRATIONS,
  testRuns: [],
  activityEvents: MOCK_ACTIVITY,
});

export type AppAction =
  | { type: "CREATE_CAMPAIGN"; payload: Campaign }
  | { type: "UPDATE_CAMPAIGN"; payload: Campaign }
  | { type: "CREATE_INTEGRATION"; payload: Integration }
  | { type: "UPDATE_INTEGRATION"; payload: Integration }
  | { type: "RUN_TEST"; payload: { integrationId: string; testRun: TestRun } }
  | { type: "ACTIVATE_INTEGRATION"; payload: { integrationId: string; at: string } }
  | { type: "PAUSE_INTEGRATION"; payload: { integrationId: string; at: string } }
  | { type: "ARCHIVE_INTEGRATION"; payload: { integrationId: string; at: string } }
  | { type: "BULK_IMPORT"; payload: Integration[] }
  | { type: "MARK_USED"; payload: { integrationId: string; at: string } }
  | { type: "ADD_ACTIVITY"; payload: ActivityEvent }
  | { type: "RESET_DATA" }
  | { type: "HYDRATE"; payload: AppState };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "CREATE_CAMPAIGN":
      return { ...state, campaigns: [...state.campaigns, action.payload] };
    case "UPDATE_CAMPAIGN":
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => campaign.id === action.payload.id ? action.payload : campaign)
      };
    case "CREATE_INTEGRATION":
      return { ...state, integrations: [...state.integrations, action.payload] };
    case "UPDATE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map(integration => integration.id === action.payload.id ? action.payload : integration)
      };
    case "RUN_TEST":
      return {
        ...state,
        testRuns: [...state.testRuns, action.payload.testRun],
        integrations: state.integrations.map(integration => {
          if (integration.id !== action.payload.integrationId) return integration;
          return {
            ...integration,
            lastTestedAt: action.payload.testRun.createdAt,
            lastSuccessfulTestAt: action.payload.testRun.status === "passed" ? action.payload.testRun.createdAt : integration.lastSuccessfulTestAt,
            status: action.payload.testRun.status === "passed" ? (integration.status === "active" ? "active" : "test_passed") : "failing",
            updatedAt: action.payload.testRun.createdAt,
            updatedBy: "System"
          };
        })
      };
    case "ACTIVATE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map(integration =>
          integration.id === action.payload.integrationId
            ? { ...integration, status: "active", activatedAt: action.payload.at, updatedAt: action.payload.at }
            : integration
        )
      };
    case "PAUSE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map(integration =>
          integration.id === action.payload.integrationId
            ? { ...integration, status: "paused", updatedAt: action.payload.at }
            : integration
        )
      };
    case "ARCHIVE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map(integration =>
          integration.id === action.payload.integrationId
            ? { ...integration, status: "archived", updatedAt: action.payload.at }
            : integration
        )
      };
    case "BULK_IMPORT":
      return { ...state, integrations: [...state.integrations, ...action.payload] };
    case "MARK_USED":
      return {
        ...state,
        integrations: state.integrations.map(integration =>
          integration.id === action.payload.integrationId
            ? {
              ...integration,
              usageCount: integration.usageCount + 1,
              lastUsedAt: action.payload.at,
              lastSuccessfulCallAt: action.payload.at
            }
            : integration
        )
      };
    case "ADD_ACTIVITY":
      return { ...state, activityEvents: [action.payload, ...state.activityEvents] };
    case "RESET_DATA":
      return createInitialState();
    case "HYDRATE":
      return action.payload;
    default:
      return state;
  }
}
