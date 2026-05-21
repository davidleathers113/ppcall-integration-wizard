import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "../shared/ToastProvider";

interface EndpointBlockProps {
  method: "POST" | "GET";
  url: string;
}

const EndpointBlock: React.FC<EndpointBlockProps> = ({ method, url }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Endpoint copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <span
        data-testid="endpoint-method"
        className="inline-flex items-center self-start rounded-lg bg-purple-600 text-white px-2.5 py-1 text-[11px] font-bold tracking-wider"
      >
        {method}
      </span>
      <code
        data-testid="endpoint-url"
        className="flex-1 font-mono text-sm sm:text-base text-slate-900 break-all"
      >
        {url}
      </code>
      <button
        data-testid="endpoint-copy"
        onClick={handleCopy}
        aria-label="Copy endpoint"
        className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold transition-colors"
      >
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

export default EndpointBlock;
