import React, { useMemo } from "react";
import { Zap } from "lucide-react";
import { useAppContext } from "../../store/AppStore";
import {
  selectCampaignById,
  selectIntegrationByShareSlug
} from "../../store/selectors";
import {
  buildAcceptedResponse,
  buildCurlJson,
  buildCurlQuery,
  buildFieldDescriptors,
  buildRejectedResponse,
  getResolvedSource,
  resolveEndpoint
} from "../../utils/specRender";
import EndpointBlock from "./EndpointBlock";
import FieldsTable from "./FieldsTable";
import SampleRequestTabs from "./SampleRequestTabs";
import ResponseShape from "./ResponseShape";
import SpecHero from "./SpecHero";
import StatePage from "./StatePage";

interface PublisherSpecPageProps {
  slug: string;
  sourceId?: string;
}

const PublisherSpecPage: React.FC<PublisherSpecPageProps> = ({ slug, sourceId }) => {
  const { state } = useAppContext();
  const integration = selectIntegrationByShareSlug(state, slug);

  const data = useMemo(() => {
    if (!integration) return null;
    const campaign = selectCampaignById(state, integration.campaignId);
    const source = getResolvedSource(integration, sourceId);
    const descriptors = buildFieldDescriptors(integration, source?.id);
    const endpoint = resolveEndpoint(integration, source);
    return {
      campaign,
      source,
      descriptors,
      endpoint,
      curlQuery: buildCurlQuery({
        endpoint,
        descriptors,
        source,
        publisherIdParam: descriptors.some(d => d.name === "publisher_id") ? undefined : "publisher_id"
      }),
      curlJson: buildCurlJson({
        endpoint,
        descriptors,
        source,
        publisherIdParam: descriptors.some(d => d.name === "publisher_id") ? undefined : "publisher_id"
      }),
      accepted: buildAcceptedResponse(integration),
      rejected: buildRejectedResponse()
    };
  }, [integration, sourceId, state]);

  if (!integration) {
    return (
      <StatePage
        title="Link unavailable"
        message="This integration link is invalid or has been removed. Please contact your account manager for an up-to-date link."
        testId="spec-not-found"
      />
    );
  }

  const spec = integration.config.shareableSpec;

  if (spec?.revokedAt) {
    return (
      <StatePage
        title="Link revoked"
        message="This integration link has been revoked. Please request a new link from your account manager."
        testId="spec-revoked"
      />
    );
  }

  if (!data) return null;

  return (
    <div
      data-testid="publisher-spec-page"
      className="min-h-screen bg-slate-50 text-slate-900 font-sans"
    >
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-purple-600 fill-purple-600" size={20} />
            <span className="font-semibold text-sm text-slate-900">PPCall Studio</span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium">
            Integration Guide
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        <section className="animate-fade-up">
          <SpecHero integration={integration} campaign={data.campaign} source={data.source} />
        </section>

        {spec?.notes && (
          <section className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-5 py-4">
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
              {spec.notes}
            </p>
          </section>
        )}

        <section className="space-y-3">
          <SectionLabel>Endpoint</SectionLabel>
          <EndpointBlock method="POST" url={data.endpoint} />
          <p className="text-xs text-slate-500 leading-relaxed">
            Send a single POST per call. Responses return JSON. Submit each
            unique caller once — duplicates are deduplicated server-side.
          </p>
        </section>

        <section className="space-y-3">
          <SectionLabel>Quick start</SectionLabel>
          <SampleRequestTabs curlQuery={data.curlQuery} curlJson={data.curlJson} />
        </section>

        <section className="space-y-3">
          <SectionLabel>Fields</SectionLabel>
          <FieldsTable descriptors={data.descriptors} />
          <p className="text-xs text-slate-500 leading-relaxed">
            Required fields must be present on every call. Optional fields
            improve routing quality and may unlock higher payouts.
          </p>
        </section>

        <section className="space-y-3">
          <SectionLabel>Response</SectionLabel>
          <ResponseShape accepted={data.accepted} rejected={data.rejected} />
          <p className="text-xs text-slate-500 leading-relaxed">
            <code className="font-mono text-slate-700">accepted: true</code>{" "}
            means the call was matched to a buyer. Route to{" "}
            <code className="font-mono text-slate-700">phone_number</code>{" "}
            within{" "}
            <code className="font-mono text-slate-700">expires_in_seconds</code>.
          </p>
        </section>

        <footer className="pt-12 pb-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <span>
            Questions? Reach out to your account manager.
          </span>
          <span className="font-mono text-[10px] tracking-wider">
            spec · {slug}
          </span>
        </footer>
      </main>
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
    {children}
  </h2>
);

export default PublisherSpecPage;
