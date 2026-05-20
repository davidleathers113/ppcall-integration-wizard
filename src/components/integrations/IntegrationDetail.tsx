import React, { useState } from "react";
import { 
  Terminal, 
  History, 
  ChevronLeft,
  Settings,
  Code,
  FileText,
  Activity,
  Pause,
  Archive,
  Play,
  Gauge
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { calculateFreshnessStatus, getDaysSince, getFreshnessDetails } from "../../utils/freshness";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { selectActivityForIntegration, selectLatestTestRunForIntegration } from "../../store/selectors";
import BuyerConfigForm from "./BuyerConfigForm";
import RawJsonEditor from "./RawJsonEditor";
import PublisherInstructions from "./PublisherInstructions";
import TestConsole from "../test-console/TestConsole";

interface IntegrationDetailProps {
  integrationId: string;
  onBack: () => void;
}

const IntegrationDetail: React.FC<IntegrationDetailProps> = ({ integrationId, onBack }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const [activeTab, setActiveTab] = useState("overview");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const integration = state.integrations.find(i => i.id === integrationId);

  if (!integration) return <div>Integration not found</div>;

  const currentStatus = calculateFreshnessStatus(integration);
  const isPublisher = integration.direction === "publisher";
  const freshness = getFreshnessDetails(integration);
  const latestTestRun = selectLatestTestRunForIntegration(state, integration.id);
  const integrationActivity = selectActivityForIntegration(state, integrationId);
  const failedChecklistItems = latestTestRun?.checklist.filter(item => item.status === "fail") || [];

  const handleActivate = () => {
    const result = actions.activateIntegration(integration.id);
    setActionMessage(result.message);
  };

  const handlePause = () => {
    actions.pauseIntegration(integration.id);
    setActionMessage("Integration paused.");
  };

  const handleArchive = () => {
    actions.archiveIntegration(integration.id);
    setActionMessage("Integration archived.");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "freshness", label: "Freshness", icon: Gauge },
    { id: "configure", label: "Configure", icon: Settings },
    { id: "raw-json", label: "Raw JSON", icon: Code },
    { id: "test", label: "Test Console", icon: Terminal },
    ...(isPublisher ? [{ id: "instructions", label: "Instructions", icon: FileText }] : []),
    { id: "activity", label: "Activity", icon: History },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Integration Details">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Direction</span>
                  <span className="text-sm font-semibold capitalize">{integration.direction}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="text-sm font-semibold capitalize">{integration.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Preset</span>
                  <span className="text-sm font-semibold">{integration.platformPreset}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Created</span>
                  <span className="text-sm font-semibold">{new Date(integration.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Created By</span>
                  <span className="text-sm font-semibold">{integration.createdBy}</span>
                </div>
              </div>
            </Card>

            <Card title="Performance & Freshness">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Status</span>
                  <Badge data-testid="integration-status" variant={currentStatus}>{currentStatus}</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Usage Count</span>
                  <span className="text-sm font-semibold">{integration.usageCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Error Rate</span>
                  <span className={`text-sm font-semibold ${integration.errorRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                    {(integration.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Days Since Last Use</span>
                  <span className="text-sm font-semibold">
                    {integration.lastUsedAt ? getDaysSince(integration.lastUsedAt) : "Never"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Last Successful Test</span>
                  <span className="text-sm font-semibold">
                    {integration.lastSuccessfulTestAt ? new Date(integration.lastSuccessfulTestAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        );
      case "configure":
        return (
          <Card>
            {!isPublisher ? (
              <BuyerConfigForm integration={integration} />
            ) : (
              <div className="p-8 text-center text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl">
                Publisher configuration is driven by standard presets. View "Raw JSON" to inspect fields.
              </div>
            )}
          </Card>
        );
      case "freshness":
        return (
          <Card title="Freshness">
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Persisted Status</span>
                <Badge variant={integration.status}>{integration.status}</Badge>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Computed Freshness</span>
                <Badge variant={freshness.status}>{freshness.status}</Badge>
              </div>
              <p className="text-sm text-slate-700"><strong>Reason:</strong> {freshness.reason}</p>
              <p className="text-sm text-slate-700"><strong>Recommended action:</strong> {freshness.recommendedAction}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">Days since last use: <strong>{freshness.daysSinceLastUse ?? "Never"}</strong></div>
                <div className="p-3 bg-slate-50 rounded-lg">Days since successful test: <strong>{freshness.daysSinceLastSuccessfulTest ?? "Never"}</strong></div>
                <div className="p-3 bg-slate-50 rounded-lg">Edited after test: <strong>{freshness.editedAfterLastSuccessfulTest ? "Yes" : "No"}</strong></div>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-sm font-semibold text-slate-900">Latest Test</p>
                <p className="text-xs text-slate-500">{latestTestRun ? `${latestTestRun.status} at ${new Date(latestTestRun.createdAt).toLocaleString()}` : "No stored test run."}</p>
                {failedChecklistItems.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-red-700">
                    {failedChecklistItems.slice(0, 3).map(item => <li key={item.label}>{item.label}: {item.message}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab("test")} className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold">Run Test</button>
                <button onClick={() => actions.markIntegrationUsed(integration.id)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold">Mark Used</button>
              </div>
            </div>
          </Card>
        );
      case "raw-json":
        return <RawJsonEditor integration={integration} />;
      case "test":
        return (
          <Card>
            {/* Minimal inline test console injected with just this integration */}
            <TestConsole overrideIntegrationId={integration.id} />
          </Card>
        );
      case "instructions":
        return <PublisherInstructions integration={integration} />;
      case "activity":
        return (
          <Card>
            <div className="space-y-4">
              {integrationActivity.map(event => (
                <div key={event.id} className="p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-900 font-medium">{event.message}</p>
                    <p className="text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString()} • {event.actor}</p>
                  </div>
                  <Badge variant="outline">{event.eventType}</Badge>
                </div>
              ))}
              {integrationActivity.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-4">No activity recorded yet.</div>
              )}
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div data-testid="integration-detail-page" className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <button
          data-testid="back-button"
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{integration.name}</h2>
            <Badge variant={currentStatus}>{currentStatus}</Badge>
          </div>
          <p className="text-slate-500 text-sm font-mono mt-1">{integration.id}</p>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="activate-button"
            onClick={handleActivate}
            disabled={integration.status === "active" || integration.status === "archived"}
            title={latestTestRun?.status === "passed" ? "Activate integration" : "Run and pass a stored test before activation."}
            className="px-3 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-500 flex items-center gap-1"
          >
            <Play size={14} /> Activate
          </button>
          <button
            data-testid="pause-button"
            onClick={handlePause}
            disabled={integration.status === "paused" || integration.status === "archived"}
            className="px-3 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-1"
          >
            <Pause size={14} /> Pause
          </button>
          <button
            data-testid="archive-button"
            onClick={handleArchive}
            disabled={integration.status === "archived"}
            className="px-3 py-2 text-xs font-bold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
          >
            <Archive size={14} /> Archive
          </button>
        </div>
      </header>

      {actionMessage && (
        <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 text-sm">
          {actionMessage}
        </div>
      )}

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              data-testid={`tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default IntegrationDetail;
