import React, { useMemo, useState } from "react";
import { Copy, Check, ExternalLink, Link2, RefreshCw, Trash2 } from "lucide-react";
import type { Integration } from "../../models/appTypes";
import Card from "../shared/Card";
import { useAppActions } from "../../store/useAppActions";
import { useToast } from "../shared/ToastProvider";
import { buildPublicSpecUrl } from "../../utils/specRender";

interface ShareLinkPanelProps {
  integration: Integration;
}

const ShareLinkPanel: React.FC<ShareLinkPanelProps> = ({ integration }) => {
  const actions = useAppActions();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const spec = integration.config.shareableSpec;
  const sources = integration.config.publisherSources || [];
  const active = spec && !spec.revokedAt;
  const fullUrl = useMemo(
    () => (spec ? buildPublicSpecUrl(spec.slug, selectedSourceId || spec.defaultSourceId) : ""),
    [spec, selectedSourceId]
  );

  const handleGenerate = () => {
    const created = actions.createShareLink(integration.id, {
      defaultSourceId: selectedSourceId || undefined,
      notes: notes.trim() || undefined
    });
    if (created) {
      toast.success("Publisher link generated.");
    }
  };

  const handleRegenerate = () => {
    const created = actions.createShareLink(integration.id, {
      defaultSourceId: spec?.defaultSourceId,
      notes: spec?.notes,
      endpointOverride: spec?.endpointOverride
    });
    if (created) {
      toast.success("Generated a fresh link. The old one no longer resolves.");
    }
  };

  const handleRevoke = () => {
    actions.revokeShareLink(integration.id);
    toast.info("Link revoked.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  };

  const handleOpen = () => {
    if (!spec) return;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  if (!active) {
    return (
      <Card className="overflow-visible">
        <div className="text-center py-6 px-4 max-w-md mx-auto space-y-5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-purple-100 text-purple-700">
            <Link2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {spec?.revokedAt ? "This link was revoked" : "Send your publisher a guided link"}
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Generate a shareable page that documents exactly how to send calls
              into this integration — endpoint, required fields, sample requests,
              and response shape.
            </p>
          </div>

          {sources.length > 0 && (
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Bind to a source <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                data-testid="share-link-source-select"
                value={selectedSourceId}
                onChange={event => setSelectedSourceId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400"
              >
                <option value="">No specific source</option>
                {sources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                The link will pre-fill the chosen source's publisher / sub-affiliate
                IDs in all sample requests.
              </p>
            </div>
          )}

          <div className="text-left">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Notes for the publisher <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              data-testid="share-link-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              rows={2}
              placeholder="Anything you want them to read first…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 resize-none"
            />
          </div>

          <button
            data-testid="share-link-generate"
            onClick={handleGenerate}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
          >
            <Link2 size={15} />
            Generate publisher link
          </button>
        </div>
      </Card>
    );
  }

  const boundSource = sources.find(source => source.id === (selectedSourceId || spec!.defaultSourceId));

  return (
    <div className="space-y-5">
      <Card className="overflow-visible">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Link is live
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Created {new Date(spec!.createdAt).toLocaleString()} by {spec!.createdBy}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                data-testid="share-link-regenerate"
                onClick={handleRegenerate}
                title="Rotate to a new slug. The old link will stop working."
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <RefreshCw size={12} />
                Rotate
              </button>
              <button
                data-testid="share-link-revoke"
                onClick={handleRevoke}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <Trash2 size={12} />
                Revoke
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 ring-1 ring-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <code
              data-testid="share-link-url"
              className="flex-1 font-mono text-xs sm:text-sm text-slate-100 break-all"
            >
              {fullUrl}
            </code>
            <div className="flex items-center gap-1.5">
              <button
                data-testid="share-link-copy"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                data-testid="share-link-open"
                onClick={handleOpen}
                aria-label="Open in new tab"
                className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white p-2 transition-colors"
              >
                <ExternalLink size={13} />
              </button>
            </div>
          </div>

          {sources.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Preview as source
              </label>
              <select
                data-testid="share-link-preview-source"
                value={selectedSourceId}
                onChange={event => setSelectedSourceId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400"
              >
                <option value="">
                  {spec!.defaultSourceId
                    ? `Default (${sources.find(source => source.id === spec!.defaultSourceId)?.name ?? spec!.defaultSourceId})`
                    : "No specific source"}
                </option>
                {sources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Changing this updates the example values shown on the page —
                it doesn't change which link to send.
              </p>
            </div>
          )}
        </div>
      </Card>

      {boundSource && (
        <Card title="Bound source" subtitle="Examples on the spec page reflect this source's IDs.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SourceField label="Source" value={boundSource.name} />
            <SourceField label="Publisher ID" value={boundSource.publisherId} mono />
            {boundSource.sourceId && (
              <SourceField label="Source ID" value={boundSource.sourceId} mono />
            )}
            {boundSource.subAffiliateId && (
              <SourceField label="Sub Affiliate ID" value={boundSource.subAffiliateId} mono />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const SourceField: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono
}) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
      {label}
    </p>
    <p className={`mt-0.5 text-slate-900 ${mono ? "font-mono text-xs" : "font-medium"}`}>
      {value}
    </p>
  </div>
);

export default ShareLinkPanel;
