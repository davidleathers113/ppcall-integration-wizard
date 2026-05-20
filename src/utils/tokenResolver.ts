export const DEFAULT_TOKENS: Record<string, string> = {
  call_id: "call_abc123xyz",
  caller_id: "7275551234",
  inbound_number: "+18005551000",
  publisher_id: "pub_999",
  campaign_id: "camp_hvac_01",
  campaign_name: "HVAC Inbound",
  zip: "34655",
  state: "FL",
  city: "New Port Richey",
  sub_id: "sub_affiliate_01",
  click_id: "click_uvw987",
  trusted_form: "https://cert.trustedform.com/abc",
  jornaya: "jornaya-token-123",
  call_start_time: "2026-05-19T10:00:00Z",
  call_duration: "120",
  recording_url: "https://recordings.local/call_abc123xyz.mp3",
  conversion_status: "converted"
};

export function resolveTokens(input: string, tokens: Record<string, string> = DEFAULT_TOKENS): string {
  return input.replace(/\{\{([^{}]+)\}\}/g, (match, tokenName) => {
    return tokens[tokenName.trim()] || match;
  });
}

export function resolveObjectTokens(obj: unknown, tokens: Record<string, string> = DEFAULT_TOKENS): unknown {
  if (typeof obj === "string") {
    return resolveTokens(obj, tokens);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => resolveObjectTokens(item, tokens));
  }
  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      result[key] = resolveObjectTokens((obj as Record<string, unknown>)[key], tokens);
    }
    return result;
  }
  return obj;
}
