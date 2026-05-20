import React from "react";
import { 
  LayoutDashboard, 
  Layers, 
  Zap, 
  PlusCircle, 
  Upload, 
  Terminal, 
  Bot, 
  FileCode, 
  History 
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "campaigns", label: "Campaigns", icon: Layers },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "add-integration", label: "Add Integration", icon: PlusCircle },
    { id: "bulk-import", label: "Bulk Import", icon: Upload },
    { id: "test-console", label: "Test Console", icon: Terminal },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "developer", label: "Developer/API", icon: FileCode },
    { id: "activity", label: "Activity", icon: History },
  ];

  return (
    <aside className="w-full bg-slate-900 text-slate-300 md:h-screen md:w-64 md:sticky md:top-0 flex flex-col border-r border-slate-800">
      <div className="p-4 md:p-6">
        <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <Zap className="text-purple-500 fill-purple-500" size={24} />
          <span>PPCall Studio</span>
        </h1>
      </div>
      
      <nav className="px-4 pb-4 md:flex-1 md:py-4 overflow-x-auto">
        <ul className="flex gap-2 md:block md:space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id} className="shrink-0 md:shrink">
                <button
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? "bg-purple-600 text-white" 
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden md:block p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>Mock Environment v1.0</p>
        <p>© 2026 Self-Service PPCall Integration Studio</p>
      </div>
    </aside>
  );
};

export default Sidebar;
