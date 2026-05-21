import React from "react";
import { Zap } from "lucide-react";

interface StatePageProps {
  title: string;
  message: string;
  testId?: string;
}

const StatePage: React.FC<StatePageProps> = ({ title, message, testId }) => {
  return (
    <div
      data-testid={testId}
      className="min-h-screen bg-slate-50 font-sans flex flex-col"
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
          <Zap className="text-purple-600 fill-purple-600" size={20} />
          <span className="font-semibold text-sm text-slate-900">PPCall Studio</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center animate-fade-up">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>
      </main>
    </div>
  );
};

export default StatePage;
