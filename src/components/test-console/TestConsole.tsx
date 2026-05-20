import React, { useState } from "react";
import { Play, Terminal, CheckCircle2, XCircle, Info, ChevronRight, ChevronDown, Zap } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { DEFAULT_TOKENS } from "../../utils/tokenResolver";
import type { TestRun } from "../../models/appTypes";

interface TestConsoleProps {
  overrideIntegrationId?: string;
}

const TestConsole: React.FC<TestConsoleProps> = ({ overrideIntegrationId }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const initialIntegrationId = overrideIntegrationId || (state.integrations.length > 0 ? state.integrations[0].id : "");
  
  const [selectedIntId, setSelectedIntId] = useState(initialIntegrationId);
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("checklist");
  const [inputTokens, setInputTokens] = useState(DEFAULT_TOKENS);

  const selectedIntegration = state.integrations.find(i => i.id === selectedIntId);

  const handleRunTest = () => {
    if (!selectedIntegration) return;
    setIsRunning(true);
    
    setTimeout(() => {
      const result = actions.runIntegrationTest(selectedIntegration.id, inputTokens);
      if (!result) return;
      setTestRun(result);
      setIsRunning(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {!overrideIntegrationId && (
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Test Console</h2>
            <p className="text-slate-500">Validate integration endpoints and response parsing.</p>
          </div>
        </header>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {!overrideIntegrationId && (
          <div className="lg:col-span-1 space-y-4">
            <Card title="Select Integration">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {state.integrations.map(int => (
                  <button
                    key={int.id}
                    onClick={() => { setSelectedIntId(int.id); setTestRun(null); }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedIntId === int.id 
                        ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600" 
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 truncate">{int.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">{int.direction} • {int.type}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className={`space-y-6 ${overrideIntegrationId ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          <Card 
            title={selectedIntegration?.name} 
            subtitle="Configure test parameters and run simulation"
            headerAction={
              <button 
                onClick={handleRunTest}
                disabled={isRunning}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                Run Test
              </button>
            }
          >
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800">
              This is a simulated test. No external endpoint is called.
            </div>
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {["caller_id", "zip", "state", "publisher_id", "campaign_id", "trusted_form", "jornaya"].map(token => (
                <label key={token} className="text-[10px] font-bold text-slate-500 uppercase">
                  {token}
                  <input
                    className="mt-1 w-full p-2 border rounded text-xs font-mono normal-case"
                    value={inputTokens[token] || ""}
                    onChange={(event) => setInputTokens(current => ({ ...current, [token]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
            {!testRun && !isRunning ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Terminal size={32} />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold">Ready to Test</p>
                  <p className="text-sm text-slate-500">Click the button above to start a simulated integration test.</p>
                </div>
              </div>
            ) : isRunning ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600 animate-pulse">
                  <Zap size={32} fill="currentColor" />
                </div>
                <p className="text-slate-500 animate-pulse">Executing simulation sequence...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {testRun?.checklist.some(item => item.status === "fail") && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm font-bold text-red-900">Suggested Fixes</p>
                    <ul className="mt-2 space-y-1 text-xs text-red-700">
                      {testRun?.checklist.filter(item => item.status === "fail").map(item => (
                        <li key={item.label}>{item.label}: {item.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${testRun?.status === "passed" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center gap-3">
                    {testRun?.status === "passed" ? (
                      <CheckCircle2 className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-red-600" size={24} />
                    )}
                    <div>
                      <p className={`font-bold ${testRun?.status === "passed" ? "text-green-900" : "text-red-900"}`}>
                        Test {testRun?.status.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-600">Response time: {testRun?.responseTimeMs}ms</p>
                    </div>
                  </div>
                  <Badge variant={testRun?.status === "passed" ? "success" : "error"}>{testRun?.status || ""}</Badge>
                </div>

                <div className="space-y-4">
                  {/* Checklist Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === "checklist" ? null : "checklist")}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <CheckCircle2 size={16} className="text-slate-400" />
                        Verification Checklist
                      </div>
                      {expandedSection === "checklist" ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSection === "checklist" && (
                      <div className="p-4 space-y-3 bg-white">
                        {testRun?.checklist.map((item, i) => (
                          <div key={i} className="flex gap-3">
                            {item.status === "pass" ? (
                              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                            ) : item.status === "fail" ? (
                              <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            ) : (
                              <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <JsonSection
                    id="tokens"
                    title="Resolved Tokens"
                    icon={<Info size={16} className="text-slate-400" />}
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    value={inputTokens}
                    textClassName="text-amber-300"
                  />

                  {/* Request Preview */}
                  <JsonSection
                    id="request"
                    title="Request Preview"
                    icon={<Terminal size={16} className="text-slate-400" />}
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    value={testRun?.requestPreview}
                    textClassName="text-green-400"
                  />

                  {/* Raw Response */}
                  <JsonSection
                    id="response"
                    title="Raw Response"
                    icon={<Info size={16} className="text-slate-400" />}
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    value={testRun?.rawResponse}
                    textClassName="text-blue-300"
                  />

                  <JsonSection
                    id="parsed"
                    title="Parsed Result"
                    icon={<CheckCircle2 size={16} className="text-slate-400" />}
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    value={testRun?.parsedResult}
                    textClassName="text-purple-300"
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestConsole;

const JsonSection = ({
  id,
  title,
  icon,
  expandedSection,
  setExpandedSection,
  value,
  textClassName
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  expandedSection: string | null;
  setExpandedSection: React.Dispatch<React.SetStateAction<string | null>>;
  value: unknown;
  textClassName: string;
}) => (
  <div className="border rounded-lg overflow-hidden">
    <button
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      {expandedSection === id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
    {expandedSection === id && (
      <div className="p-4 bg-slate-900">
        <pre className={`text-xs overflow-auto max-h-64 whitespace-pre-wrap font-mono ${textClassName}`}>
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    )}
  </div>
);
