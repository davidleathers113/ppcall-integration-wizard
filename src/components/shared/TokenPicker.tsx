import React, { useState } from "react";
import { Copy, Tag } from "lucide-react";
import { useToast } from "./ToastProvider";

// eslint-disable-next-line react-refresh/only-export-components
export const TOKEN_OPTIONS = [
  "caller_id",
  "zip",
  "state",
  "city",
  "publisher_id",
  "campaign_id",
  "campaign_name",
  "call_id",
  "trusted_form",
  "jornaya",
  "recording_url",
] as const;

export type TokenName = (typeof TOKEN_OPTIONS)[number];

interface TokenPickerProps {
  onInsert?: (token: string) => void;
  label?: string;
  compact?: boolean;
  testId?: string;
}

const TokenPicker: React.FC<TokenPickerProps> = ({
  onInsert,
  label = "Tokens",
  compact = false,
  testId = "token-picker",
}) => {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const handleClickToken = async (token: string) => {
    const placeholder = `{{${token}}}`;
    if (onInsert) {
      onInsert(placeholder);
      return;
    }
    try {
      await navigator.clipboard.writeText(placeholder);
      toast.success(`Copied ${placeholder} to clipboard.`);
    } catch {
      toast.error("Could not copy token to clipboard.");
    }
  };

  return (
    <div data-testid={testId} className="relative inline-block">
      <button
        type="button"
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen(value => !value)}
        className={`inline-flex items-center gap-1 text-xs font-bold text-purple-600 border border-purple-200 rounded-md ${
          compact ? "px-2 py-1" : "px-3 py-1.5"
        } hover:bg-purple-50`}
      >
        <Tag size={12} /> {label}
      </button>
      {open && (
        <div
          data-testid={`${testId}-menu`}
          className="absolute right-0 z-10 mt-1 w-56 max-h-60 overflow-auto bg-white border border-slate-200 shadow-lg rounded-lg p-1"
        >
          {TOKEN_OPTIONS.map(token => (
            <button
              key={token}
              type="button"
              data-testid={`${testId}-option-${token}`}
              onClick={() => {
                handleClickToken(token);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-purple-50 rounded flex items-center gap-2"
            >
              <Copy size={10} className="text-slate-400" />
              <span className="font-mono">{`{{${token}}}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenPicker;
