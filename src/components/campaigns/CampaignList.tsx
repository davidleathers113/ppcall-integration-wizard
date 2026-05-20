import React from "react";
import { Plus, ExternalLink } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";

interface CampaignListProps {
  onSelectCampaign: (id: string) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({ onSelectCampaign }) => {
  const { state, dispatch } = useAppContext();

  const handleCreateCampaign = () => {
    const now = new Date().toISOString();
    const campaignNumber = state.campaigns.length + 1;
    dispatch({
      type: "CREATE_CAMPAIGN",
      payload: {
        id: `camp_mock_${campaignNumber}`,
        name: `New Mock Campaign ${campaignNumber}`,
        vertical: "General",
        status: "draft",
        createdAt: now
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campaigns</h2>
          <p className="text-slate-500">Manage your PPCall campaigns and their routing configurations.</p>
        </div>
        <button onClick={handleCreateCampaign} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Create Campaign
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vertical</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Pubs</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Buyers</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Integrations</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.campaigns.map((campaign) => {
                const campaignIntegrations = state.integrations.filter(i => i.campaignId === campaign.id);
                const pubCount = campaignIntegrations.filter(i => i.direction === "publisher").length;
                const buyerCount = campaignIntegrations.filter(i => i.direction === "buyer").length;

                return (
                  <tr key={campaign.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onSelectCampaign(campaign.id)}
                        className="text-sm font-semibold text-slate-900 hover:text-purple-600 transition-colors"
                      >
                        {campaign.name}
                      </button>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{campaign.id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{campaign.vertical}</td>
                    <td className="px-6 py-4">
                      <Badge variant={campaign.status === "active" ? "success" : "warning"}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-medium">{pubCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-medium">{buyerCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-medium">
                      {campaignIntegrations.length}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => onSelectCampaign(campaign.id)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default CampaignList;
