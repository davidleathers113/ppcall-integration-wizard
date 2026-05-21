import React, { useState } from "react";
import CodeBlock from "./CodeBlock";

interface SampleRequestTabsProps {
  curlQuery: string;
  curlJson: string;
}

type TabKey = "query" | "json";

const TABS: Array<{ key: TabKey; label: string; sublabel: string }> = [
  { key: "query", label: "cURL", sublabel: "query string" },
  { key: "json", label: "cURL", sublabel: "JSON body" }
];

const SampleRequestTabs: React.FC<SampleRequestTabsProps> = ({ curlQuery, curlJson }) => {
  const [active, setActive] = useState<TabKey>("query");
  const code = active === "query" ? curlQuery : curlJson;

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-xl w-fit" role="tablist">
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              data-testid={`sample-tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] font-medium ${
                  isActive ? "text-slate-400" : "text-slate-400"
                }`}
              >
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>
      <CodeBlock
        code={code}
        language={active === "query" ? "shell · query" : "shell · json"}
        testId={`sample-code-${active}`}
        ariaLabel="Sample request"
      />
    </div>
  );
};

export default SampleRequestTabs;
