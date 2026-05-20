import { describe, expect, it } from "vitest";
import {
  buildProposal,
  extractCurrencyAmount,
  extractDailyCap,
  extractMaxConcurrency,
  extractPhoneNumber,
  extractScheduleHints,
  extractSipAddress,
  scoreDirectTargetProposal,
} from "../aiProposal";

describe("aiProposal extractors", () => {
  it("extractPhoneNumber recognizes E.164 with separators", () => {
    expect(extractPhoneNumber("Send to +1 (800) 555-1212.")).toEqual({
      value: "+18005551212",
      explicit: true,
    });
  });

  it("extractPhoneNumber rejects short numbers", () => {
    expect(extractPhoneNumber("Lucky number +12345.").explicit).toBe(false);
  });

  it("extractSipAddress finds sip: and sips: schemes", () => {
    expect(extractSipAddress("Route to sip:buyer@host.com today.")).toEqual({
      value: "sip:buyer@host.com",
      explicit: true,
    });
    expect(extractSipAddress("Secure dest: sips:secure@host.com end.")).toEqual({
      value: "sips:secure@host.com",
      explicit: true,
    });
  });

  it("extractSipAddress returns non-explicit when no scheme present", () => {
    expect(extractSipAddress("Plain text, no URI here.").explicit).toBe(false);
  });

  it("extractCurrencyAmount finds dollar-prefixed values", () => {
    expect(extractCurrencyAmount("Buyer pays $35 per call.")).toEqual({
      value: 35,
      explicit: true,
    });
  });

  it("extractCurrencyAmount falls back to keyword detection", () => {
    expect(extractCurrencyAmount("Payout is 42 per call.")).toEqual({
      value: 42,
      explicit: true,
    });
  });

  it("extractDailyCap reads keyword variations", () => {
    expect(extractDailyCap("Daily cap is 100.")).toEqual({ value: 100, explicit: true });
    expect(extractDailyCap("Daily cap of 75.")).toEqual({ value: 75, explicit: true });
    expect(extractDailyCap("No cap defined.")).toEqual({ value: undefined, explicit: false });
  });

  it("extractMaxConcurrency reads keyword variations", () => {
    expect(extractMaxConcurrency("Max concurrency 5.")).toEqual({ value: 5, explicit: true });
  });

  it("extractScheduleHints picks up day range and timezone", () => {
    const result = extractScheduleHints(
      "Hours are Monday through Friday 8am to 6pm Eastern."
    );
    expect(result.explicit).toBe(true);
    expect(result.value?.timezone).toBe("America/New_York");
    expect(result.value?.days).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(result.value?.startTime).toBe("08:00");
    expect(result.value?.endTime).toBe("18:00");
    expect(result.value?.mode).toBe("basic");
  });

  it("extractScheduleHints returns non-explicit for sparse text", () => {
    expect(extractScheduleHints("Just a destination.").explicit).toBe(false);
  });
});

describe("scoreDirectTargetProposal", () => {
  it("returns base score with no extracted fields", () => {
    const score = scoreDirectTargetProposal({
      destinationExplicit: false,
      payoutExplicit: false,
      conversionDurationExplicit: false,
      scheduleExplicit: false,
      timezoneExplicit: false,
      scheduleHoursExplicit: false,
      dailyCapExplicit: false,
      concurrencyExplicit: false,
      sipHeadersExplicit: false,
      warningCount: 0,
    });
    expect(score).toBe(50);
  });

  it("returns high confidence with all key fields", () => {
    const score = scoreDirectTargetProposal({
      destinationExplicit: true,
      payoutExplicit: true,
      conversionDurationExplicit: true,
      scheduleExplicit: true,
      timezoneExplicit: true,
      scheduleHoursExplicit: true,
      dailyCapExplicit: true,
      concurrencyExplicit: true,
      sipHeadersExplicit: false,
      warningCount: 0,
    });
    // 50 + 15 + 10 + 10 + 5 + 5 + 3 + 3 = 101 → clamped to 99
    expect(score).toBe(99);
  });

  it("penalizes warnings", () => {
    const base = scoreDirectTargetProposal({
      destinationExplicit: true,
      payoutExplicit: true,
      conversionDurationExplicit: false,
      scheduleExplicit: false,
      timezoneExplicit: false,
      scheduleHoursExplicit: false,
      dailyCapExplicit: false,
      concurrencyExplicit: false,
      sipHeadersExplicit: false,
      warningCount: 0,
    });
    const withWarnings = scoreDirectTargetProposal({
      destinationExplicit: true,
      payoutExplicit: true,
      conversionDurationExplicit: false,
      scheduleExplicit: false,
      timezoneExplicit: false,
      scheduleHoursExplicit: false,
      dailyCapExplicit: false,
      concurrencyExplicit: false,
      sipHeadersExplicit: false,
      warningCount: 2,
    });
    expect(withWarnings).toBe(base - 10);
  });

  it("clamps to minimum 10", () => {
    const score = scoreDirectTargetProposal({
      destinationExplicit: false,
      payoutExplicit: false,
      conversionDurationExplicit: false,
      scheduleExplicit: false,
      timezoneExplicit: false,
      scheduleHoursExplicit: false,
      dailyCapExplicit: false,
      concurrencyExplicit: false,
      sipHeadersExplicit: false,
      warningCount: 20, // would drive below 10
    });
    expect(score).toBe(10);
  });
});

describe("buildProposal — direct target confidence", () => {
  it("rich direct number instructions yield high confidence", () => {
    const proposal = buildProposal(
      "Send calls to +18005551212. Buyer pays $35 after 120 seconds. " +
        "Hours are Monday through Friday 8am to 6pm Eastern. Daily cap is 100."
    );
    expect(proposal.platformPreset).toBe("ai_detected_direct_number");
    expect(proposal.confidence).toBeGreaterThanOrEqual(85);
    expect(proposal.config.destination?.number).toBe("+18005551212");
    expect(proposal.config.payout).toBe(35);
    expect(proposal.config.conversionDurationSeconds).toBe(120);
    expect(proposal.config.schedule?.timezone).toBe("America/New_York");
    expect(proposal.config.caps?.daily).toBe(100);
  });

  it("sparse direct number instructions yield lower confidence", () => {
    const proposal = buildProposal("Send calls to +18005551212.");
    expect(proposal.platformPreset).toBe("ai_detected_direct_number");
    // destination explicit only — base 50 + 15 = 65, minus caller_id warning (-5) = 60
    expect(proposal.confidence).toBeGreaterThanOrEqual(50);
    expect(proposal.confidence).toBeLessThan(80);
  });

  it("direct SIP instructions yield direct_sip proposal", () => {
    const proposal = buildProposal(
      "Route to SIP sip:intake@buyer.example.com with max concurrency 5 and daily cap 50."
    );
    expect(proposal.platformPreset).toBe("ai_detected_direct_sip");
    expect(proposal.config.destination?.sipAddress).toBe("sip:intake@buyer.example.com");
    expect(proposal.config.caps?.concurrency).toBe(5);
    expect(proposal.config.caps?.daily).toBe(50);
    expect(proposal.confidence).toBeGreaterThanOrEqual(60);
  });

  it("legacy RTB instructions still produce an RTB proposal", () => {
    const proposal = buildProposal(
      "POST to https://buyer.example.com/ping with caller_id, zip. accepted=true."
    );
    expect(proposal.platformPreset).toBe("ai_detected_api");
    expect(proposal.config.url).toContain("buyer.example.com/ping");
  });
});
