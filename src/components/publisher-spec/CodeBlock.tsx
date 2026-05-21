import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "../shared/ToastProvider";

interface CodeBlockProps {
  code: string;
  language?: string;
  ariaLabel?: string;
  testId?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, ariaLabel, testId }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  };

  return (
    <div className="relative group rounded-2xl bg-slate-950 ring-1 ring-slate-800 overflow-hidden">
      {language && (
        <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium select-none">
          {language}
        </div>
      )}
      <pre
        data-testid={testId}
        aria-label={ariaLabel}
        className="px-5 pt-9 pb-5 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-100"
      >
        <code>{code}</code>
      </pre>
      <button
        data-testid={testId ? `${testId}-copy` : undefined}
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 text-[11px] font-medium transition-colors backdrop-blur"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

export default CodeBlock;
