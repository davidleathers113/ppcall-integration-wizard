import React from "react";
import { User, Cpu, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import Card from "../shared/Card";
import { useAppContext } from "../../store/AppStore";

const ActivityHistory: React.FC = () => {
  const { state } = useAppContext();
  const getEventIcon = (type: string) => {
    switch (type) {
      case "created": return <PlusCircleIcon className="text-blue-500" size={16} />;
      case "updated": return <User className="text-slate-400" size={16} />;
      case "tested": return <Zap className="text-purple-500" size={16} />;
      case "activated": return <ShieldCheck className="text-green-500" size={16} />;
      case "failed": return <AlertCircle className="text-red-500" size={16} />;
      default: return <Cpu className="text-slate-400" size={16} />;
    }
  };

  return (
    <div data-testid="activity-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Activity History</h2>
        <p className="text-slate-500">Audit trail for all integration and campaign modifications.</p>
      </header>

      <Card>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 before:pointer-events-none">
          {state.activityEvents.map((event) => (
            <div key={event.id} className="relative flex items-center justify-between group">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-slate-100 text-slate-500 shadow-sm z-10 transition-colors group-hover:border-purple-200">
                  {getEventIcon(event.eventType)}
                </div>
                <div className="ml-6">
                  <p className="text-sm text-slate-800">
                    <span className="font-bold text-slate-900">{event.actor}</span>
                    {" "}{event.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-300 group-hover:text-slate-500 transition-colors">
                ID: {event.id}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Helper since PlusCircle wasn't in the switch above
const PlusCircleIcon = ({ className, size }: { className: string, size: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);

export default ActivityHistory;
