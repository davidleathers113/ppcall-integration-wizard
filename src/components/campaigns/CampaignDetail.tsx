import React, { useState } from "react";
import { 
  Users, 
  Target, 
  Route, 
  Terminal, 
  Settings,
  ChevronLeft,
  History,
  PlusCircle
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { calculateFreshnessStatus } from "../../utils/freshness";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import type { IntegrationDirection } from "../../models/appTypes";

interface CampaignDetailProps {
  campaignId: string;
  onBack: () => void;
  onCreateIntegration: (context: { campaignId: string; direction?: IntegrationDirection }) => void;
}

const CampaignDetail: React.FC<CampaignDetailProps> = ({ campaignId, onBack, onCreateIntegration }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const [activeTab, setActiveTab] = useState("overview");

  const campaign = state.campaigns.find(c => c.id === campaignId);
  const integrations = state.integrations.filter(i => i.campaignId === campaignId);
  const publishers = integrations.filter(i => i.direction === "publisher");
  const buyers = integrations.filter(i => i.direction === "buyer");

  if (!campaign) return <div>Campaign not found</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "publishers", label: "Publishers", icon: Users },
    { id: "buyers", label: "Buyers", icon: Target },
    { id: "routing", label: "Routing", icon: Route },
    { id: "tests", label: "Tests", icon: Terminal },
    { id: "activity", label: "Activity", icon: History },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Campaign Health">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Vertical</span>
                  <span className="text-sm font-semibold">{campaign.vertical}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Created</span>
                  <span className="text-sm font-semibold">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Integrations</span>
                  <span className="text-sm font-semibold">{integrations.length}</span>
                </div>
                <button
                  onClick={() => onCreateIntegration({ campaignId })}
                  className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} /> Add Integration
                </button>
              </div>
            </Card>
            <Card title="Alerts">
              <div className="space-y-2">
                {integrations.some(i => calculateFreshnessStatus(i) === "failing") ? (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <Settings size={14} /> <span>1 integration is currently failing tests.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg">
                    All integrations are performing within thresholds.
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      case "publishers":
      case "buyers": {
        const list = activeTab === "publishers" ? publishers : buyers;
        const direction: IntegrationDirection = activeTab === "publishers" ? "publisher" : "buyer";
        const addSource = (integrationId: string) => {
          const integration = integrations.find(item => item.id === integrationId);
          if (!integration) return;
          const next = (integration.config.publisherSources?.length || 0) + 1;
          actions.createPublisherSource(integrationId, {
            name: `New Source ${next}`,
            publisherId: integration.config.publisherId || `pub_${integration.id}`,
            sourceId: `source_${next}`,
            subAffiliateId: `sub_${next}`,
            requiredFields: integration.config.requiredFields || ["caller_id", "zip"],
            postingUrl: integration.config.postingUrl || `https://mock-ppcall.local/rtb/${campaignId}/${integration.id}/source_${next}`,
            caps: { daily: 100 }
          });
        };
        const addTarget = (integrationId: string) => {
          const integration = integrations.find(item => item.id === integrationId);
          if (!integration) return;
          const next = (integration.config.buyerTargets?.length || 0) + 1;
          actions.createBuyerTarget(integrationId, {
            name: `New Target ${next}`,
            priority: next,
            weight: 100,
            type: integration.type,
            config: integration.config,
            caps: { daily: 100 }
          });
        };
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => onCreateIntegration({ campaignId, direction })}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add {direction === "publisher" ? "Publisher" : "Buyer"}
              </button>
            </div>
            <Card className="p-0 overflow-hidden">
              {list.map(int => (
                <div key={int.id} className="border-b border-slate-100 last:border-b-0">
                  <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{int.name}</p>
                      <p className="text-[10px] text-slate-400">{int.type.toUpperCase()} relationship • {int.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={calculateFreshnessStatus(int)}>{calculateFreshnessStatus(int)}</Badge>
                      <button
                        onClick={() => direction === "publisher" ? addSource(int.id) : addTarget(int.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Add {direction === "publisher" ? "Source" : "Target"}
                      </button>
                    </div>
                  </div>

                  {direction === "publisher" ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white border-b border-slate-100">
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source / Subaffiliate</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Required Fields</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Caps</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Usage</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(int.config.publisherSources || []).map(source => (
                          <tr key={source.id}>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{source.name}</p>
                              <p className="text-[10px] text-slate-400">{source.publisherId} • {source.subAffiliateId || source.sourceId || source.id}</p>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{source.requiredFields.join(", ")}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{source.caps?.daily ? `${source.caps.daily}/day` : "None"}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{source.usageCount.toLocaleString()} calls • {(source.errorRate * 100).toFixed(1)}% err</td>
                            <td className="px-6 py-4"><Badge variant={source.status}>{source.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white border-b border-slate-100">
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Target</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Routing</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Usage</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(int.config.buyerTargets || []).map(target => (
                          <tr key={target.id}>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{target.name}</p>
                              <p className="text-[10px] text-slate-400">{target.type.toUpperCase()} • {target.id}</p>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">Priority {target.priority} • Weight {target.weight}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{target.config.url || target.config.destinationNumber || target.config.sipAddress || "Not configured"}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{target.usageCount.toLocaleString()} calls • {(target.errorRate * 100).toFixed(1)}% err</td>
                            <td className="px-6 py-4"><Badge variant={target.status}>{target.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
              {list.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  No {activeTab} yet. Add one to start configuring this campaign.
                </div>
              )}
            </Card>

            {activeTab === "publishers" && publishers.length > 0 && (
              <Card title="Sample Integration Instructions" subtitle="Copy these for your publisher">
                <div className="bg-slate-900 rounded-xl p-4">
                  <pre className="text-xs text-blue-300 font-mono">
{JSON.stringify({
  postingUrl: publishers[0].config.postingUrl || "https://mock-ppcall.local/rtb/camp_hvac/pub_abc",
  requiredFields: publishers[0].config.requiredFields || ["caller_id", "zip"],
  acceptedResponse: {
    accepted: true,
    phone_number: "+18005551212",
    payout: 35,
    expires_in_seconds: 30
  }
}, null, 2)}
                  </pre>
                </div>
              </Card>
            )}
          </div>
        );
      }
      case "routing":
        return (
          <Card title="Call Routing Configuration">
            <div className="space-y-4">
              {buyers.map((buyer, idx) => (
                <div key={buyer.id} className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{buyer.name}</p>
                    <p className="text-[10px] text-slate-400">Weight: 100 • Priority: {idx + 1}</p>
                  </div>
                  <Badge variant="active">Active</Badge>
                </div>
              ))}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                Fallback routing is not implemented in this mock prototype.
              </div>
            </div>
          </Card>
        );
      case "tests":
        return (
          <Card title="Recent Tests">
            <div className="space-y-3">
              {state.testRuns
                .filter(testRun => integrations.some(integration => integration.id === testRun.integrationId))
                .map(testRun => {
                  const integration = integrations.find(item => item.id === testRun.integrationId);
                  return (
                    <div key={testRun.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{integration?.name || testRun.integrationId}</p>
                        <p className="text-[10px] text-slate-400">{new Date(testRun.createdAt).toLocaleString()} • {testRun.responseTimeMs}ms</p>
                      </div>
                      <Badge variant={testRun.status === "passed" ? "success" : "error"}>{testRun.status}</Badge>
                    </div>
                  );
                })}
              {state.testRuns.filter(testRun => integrations.some(integration => integration.id === testRun.integrationId)).length === 0 && (
                <div className="text-center text-slate-500 text-sm py-4">No tests have been run for this campaign yet.</div>
              )}
            </div>
          </Card>
        );
      case "activity":
        return (
          <div className="space-y-4">
            {state.activityEvents.filter(e => e.campaignId === campaignId).map(event => (
              <div key={event.id} className="p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900 font-medium">{event.message}</p>
                  <p className="text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString()} • {event.actor}</p>
                </div>
                <Badge variant="outline">{event.eventType}</Badge>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{campaign.name}</h2>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-slate-500 text-sm">{campaign.vertical} • Created Jan 2026</p>
        </div>
      </header>

      <div className="flex border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
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

export default CampaignDetail;
