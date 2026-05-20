import React from "react";
import { Zap, AlertCircle, History, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import { selectDashboardStats, selectIntegrationsNeedingAttention } from "../../store/selectors";

const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  const stats = selectDashboardStats(state);
  const needingAttention = selectIntegrationsNeedingAttention(state);

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Platform Overview</h2>
        <p className="text-slate-500">Monitor your integration health and campaign performance.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="dashboard-stat-active" className="bg-green-50/50 border-green-100">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="text-green-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-slate-900">{stats.active}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</span>
          </div>
        </Card>
        <Card data-testid="dashboard-stat-needs-testing" className="bg-purple-50/50 border-purple-100">
          <div className="flex flex-col items-center text-center">
            <Zap className="text-purple-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-slate-900">{stats.needsTesting}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Need Testing</span>
          </div>
        </Card>
        <Card data-testid="dashboard-stat-failing" className="bg-red-50/50 border-red-100">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-slate-900">{stats.failing}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Failing</span>
          </div>
        </Card>
        <Card data-testid="dashboard-stat-stale" className="bg-slate-50/50 border-slate-200">
          <div className="flex flex-col items-center text-center">
            <Clock className="text-slate-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-slate-900">{stats.stale}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stale/Dormant</span>
          </div>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <div className="flex flex-col items-center text-center">
            <TrendingUp className="text-blue-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-slate-900">{stats.usedThisWeek}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Used This Week</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Integration Health" subtitle="Integrations requiring attention">
            {needingAttention.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No issues detected. All integrations are healthy.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {needingAttention.map(int => (
                    <div key={int.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          int.currentStatus === "failing" ? "bg-red-500" :
                          int.currentStatus === "stale" ? "bg-slate-400" : "bg-yellow-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{int.name}</p>
                          <p className="text-xs text-slate-500">{int.direction} • {int.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <Badge variant={int.currentStatus}>{int.currentStatus}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar activity */}
        <Card title="Recent Activity" headerAction={<History size={16} className="text-slate-400" />}>
          <div data-testid="dashboard-recent-activity" className="space-y-4">
            {state.activityEvents.slice(0, 10).map(event => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-1">
                  <div className={`w-2 h-2 rounded-full bg-slate-200 mt-1.5`} />
                </div>
                <div>
                  <p className="text-xs text-slate-800 leading-relaxed">{event.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
