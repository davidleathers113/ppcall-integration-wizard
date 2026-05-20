import React from "react";
import { ArrowRight, ArrowLeft, MoreVertical, Terminal, ExternalLink } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { calculateFreshnessStatus } from "../../utils/freshness";
import { useAppContext } from "../../store/AppStore";

interface IntegrationListProps {
  onSelectIntegration: (id: string) => void;
}

const IntegrationList: React.FC<IntegrationListProps> = ({ onSelectIntegration }) => {
  const { state } = useAppContext();
  
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Integrations</h2>
        <p className="text-slate-500">Manage all publisher and buyer integrations across all campaigns.</p>
      </header>

      <Card className="p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Direction</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Usage</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.integrations.map((int) => {
              const currentStatus = calculateFreshnessStatus(int);
              return (
                <tr key={int.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onSelectIntegration(int.id)}
                      className="text-sm font-semibold text-slate-900 hover:text-purple-600 transition-colors text-left"
                    >
                      {int.name}
                    </button>
                    <p className="text-[10px] text-slate-400 font-mono">{int.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`p-1 rounded ${int.direction === "publisher" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                        {int.direction === "publisher" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Terminal size={12} className="text-slate-400" />
                      {int.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={currentStatus}>{currentStatus}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-medium text-slate-900">{int.usageCount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{int.errorRate * 100}% ERR</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onSelectIntegration(int.id)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                        <MoreVertical size={16} />
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
  );
};

export default IntegrationList;
