import React from "react";
import type { Campaign, Integration, PublisherSource } from "../../models/appTypes";

interface SpecHeroProps {
  integration: Integration;
  campaign?: Campaign;
  source?: PublisherSource;
}

const SpecHero: React.FC<SpecHeroProps> = ({ integration, campaign, source }) => {
  const campaignName = campaign?.name ?? "Campaign";
  const vertical = campaign?.vertical;

  return (
    <div data-testid="spec-hero" className="space-y-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500 font-semibold">
        <span>Publisher Integration Guide</span>
        {vertical && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{vertical}</span>
          </>
        )}
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
        {campaignName}
      </h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="text-slate-600 font-medium">{integration.name}</span>
        {source && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">
              Source <span className="font-semibold text-slate-900">{source.name}</span>
            </span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span
          data-testid="spec-status"
          className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
      <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
        Use this guide to send qualified calls into{" "}
        <span className="font-semibold text-slate-900">{campaignName}</span>.
        Post requests are accepted in real time and return a routing response
        within a few hundred milliseconds.
      </p>
    </div>
  );
};

export default SpecHero;
