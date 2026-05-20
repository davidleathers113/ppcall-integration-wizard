import type { Integration, TestRun, TestChecklistItem } from "../models/appTypes";
import { resolveObjectTokens, DEFAULT_TOKENS } from "./tokenResolver";
import { extractJsonPath } from "./jsonPath";
import { createId } from "./id";

export function simulateIntegrationTest(integration: Integration, inputTokens: Record<string, string> = DEFAULT_TOKENS): TestRun {
  const isBuyer = integration.direction === "buyer";
  const config = integration.config;
  const checklist: TestChecklistItem[] = [];
  
  // Deterministic response time based on integration ID length
  const responseTimeMs = 150 + (integration.id.length * 10);
  
  const rawResponse = {
    accepted: true,
    success: true,
    status: "ok",
    phone_number: "+18005551212",
    destination: "+18005551212",
    number: "+18005551212",
    bid: 45.50,
    payout: 45.50,
    duration: 120,
    lead: {
      phone_number: "+18005551212",
      payout: 45.50
    },
    reason: null
  };

  let parsedResult: Record<string, unknown> = {};

  // 1. Basic configuration checks
  if (isBuyer) {
    if (integration.type !== "static_number" && integration.type !== "sip") {
      checklist.push({
        label: "Endpoint URL present",
        status: config.url ? "pass" : "fail",
        message: config.url ? "URL configured correctly." : "Endpoint URL is missing."
      });
      checklist.push({
        label: "HTTP Method selected",
        status: config.method ? "pass" : "fail",
        message: config.method ? `Method set to ${config.method}.` : "HTTP Method is missing."
      });
      
      const timeout = config.timeoutSeconds || 3;
      if (timeout > 5) {
        checklist.push({
          label: "Timeout within limit",
          status: "fail",
          message: "Timeout must not exceed 5 seconds for RTB/Ping-Post."
        });
      } else if (timeout > 3) {
        checklist.push({
          label: "Timeout within limit",
          status: "warning",
          message: `Timeout is ${timeout}s. Consider reducing to 3s or less for faster RTB responses.`
        });
      }
    } else if (integration.type === "static_number") {
      checklist.push({
        label: "Destination number present",
        status: config.destinationNumber ? "pass" : "fail",
        message: config.destinationNumber ? "Static number configured." : "Destination number is missing."
      });
      checklist.push({
        label: "Conversion duration present",
        status: config.conversionDurationSeconds ? "pass" : "fail",
        message: config.conversionDurationSeconds ? "Conversion duration configured." : "Conversion duration is missing."
      });
      checklist.push({
        label: "Payout present",
        status: config.payout !== undefined ? "pass" : "fail",
        message: config.payout !== undefined ? "Payout configured." : "Payout is missing."
      });
    } else if (integration.type === "sip") {
      checklist.push({
        label: "SIP address present",
        status: config.sipAddress ? "pass" : "fail",
        message: config.sipAddress ? "SIP address configured." : "SIP address is missing."
      });
      checklist.push({
        label: "Conversion duration present",
        status: config.conversionDurationSeconds ? "pass" : "fail",
        message: config.conversionDurationSeconds ? "Conversion duration configured." : "Conversion duration is missing."
      });
      checklist.push({
        label: "Payout present",
        status: config.payout !== undefined ? "pass" : "fail",
        message: config.payout !== undefined ? "Payout configured." : "Payout is missing."
      });
    }
  } else {
    // Publisher checks
    checklist.push({
      label: "Publisher ID present",
      status: config.publisherId ? "pass" : "fail",
      message: config.publisherId ? "Publisher ID configured." : "Publisher ID is missing."
    });
    const hasIngress = Boolean(config.postingUrl || config.destinationNumber || config.sipAddress);
    checklist.push({
      label: "Publisher ingress configured",
      status: hasIngress ? "pass" : "fail",
      message: hasIngress ? "Posting URL, number, or SIP endpoint configured." : "Publisher posting URL, number, or SIP address is missing."
    });
    checklist.push({
      label: "Campaign ID mapped",
      status: integration.campaignId ? "pass" : "fail",
      message: integration.campaignId ? "Campaign linked." : "Campaign ID is missing."
    });
    const hasRequiredFields = config.requiredFields && config.requiredFields.length > 0;
    checklist.push({
      label: "Required fields configured",
      status: hasRequiredFields ? "pass" : "fail",
      message: hasRequiredFields ? "Fields present." : "Missing required fields."
    });
    if (hasRequiredFields) {
      checklist.push({
        label: "Caller ID required",
        status: config.requiredFields!.includes("caller_id") ? "pass" : "fail",
        message: config.requiredFields!.includes("caller_id") ? "Caller ID mapped." : "Publisher must pass caller_id."
      });
    }
    if (integration.type === "rtb") {
      checklist.push({
        label: "RTB expiration configured",
        status: config.expiresInSeconds ? "pass" : "fail",
        message: config.expiresInSeconds ? "Expiration window configured." : "RTB publisher expiration is missing."
      });
    }
  }

  // 2. Token mapping checks
  if (isBuyer && (integration.type === "rtb" || integration.type === "generic_api")) {
    const bodyStr = JSON.stringify(config.requestBody || {});
    const queryStr = JSON.stringify(config.queryParams || {});
    const hasCallerId = bodyStr.includes("caller_id") || queryStr.includes("caller_id");
    const hasZip = bodyStr.includes("zip") || queryStr.includes("zip");
    checklist.push({
      label: "Caller ID mapped",
      status: hasCallerId ? "pass" : "fail",
      message: hasCallerId ? "Caller ID token found in request." : "Caller ID must be mapped to an internal token."
    });
    checklist.push({
      label: "ZIP mapped",
      status: hasZip ? "pass" : "fail",
      message: hasZip ? "ZIP token found in request." : "ZIP token is required for this mock RTB/API test."
    });
  }

  // 3. Response parsing checks
  if (isBuyer && (integration.type === "rtb" || integration.type === "generic_api" || integration.type === "webhook")) {
    if (!config.responseParsing) {
      checklist.push({
        label: "Response parsing configured",
        status: "fail",
        message: "Response parser missing."
      });
    } else {
      checklist.push({
        label: "Accepted path defined",
        status: config.responseParsing.acceptedPath ? "pass" : "fail",
        message: config.responseParsing.acceptedPath ? "Accepted path configured." : "Accepted path is missing."
      });
      checklist.push({
        label: "Destination path defined",
        status: (config.responseParsing.destinationNumberPath || config.responseParsing.sipAddressPath) ? "pass" : "fail",
        message: (config.responseParsing.destinationNumberPath || config.responseParsing.sipAddressPath) ? "Transfer path found." : "Destination number or SIP path is missing."
      });

      // Optional but recommended fields - generate warnings
      if (!config.responseParsing.bidPath && integration.type === "rtb") {
        checklist.push({
          label: "Bid path configured",
          status: "warning",
          message: "Bid/payout path not configured. Consider adding bidPath for dynamic payout tracking."
        });
      }
      if (!config.responseParsing.rejectReasonPath) {
        checklist.push({
          label: "Reject reason path configured",
          status: "warning",
          message: "Reject reason path not configured. Recommended for debugging failed bids."
        });
      }

      // Actually parse
      const extractedAccepted = config.responseParsing.acceptedPath ? extractJsonPath(rawResponse, config.responseParsing.acceptedPath) : undefined;
      const extractedDest = config.responseParsing.destinationNumberPath ? extractJsonPath(rawResponse, config.responseParsing.destinationNumberPath) : undefined;
      const extractedBid = config.responseParsing.bidPath ? extractJsonPath(rawResponse, config.responseParsing.bidPath) : undefined;
      
      parsedResult = {
        is_accepted: extractedAccepted === config.responseParsing.acceptedValue || extractedAccepted === true || extractedAccepted === "success" || extractedAccepted === "ok",
        destination: extractedDest,
        bid_amount: extractedBid
      };

      if (!parsedResult.is_accepted || !parsedResult.destination) {
        checklist.push({
          label: "Simulated response parsed",
          status: "fail",
          message: "Could not parse accepted status or destination from simulated response using given JSONPaths."
        });
      } else {
        checklist.push({
          label: "Simulated response parsed",
          status: "pass",
          message: "Successfully extracted values from mock payload."
        });
      }
    }
  }

  const isTimeout = config.timeoutSeconds ? (responseTimeMs / 1000 > config.timeoutSeconds) : false;
  
  if (isTimeout) {
    checklist.push({
      label: "Response time",
      status: "fail",
      message: `Request timed out after ${responseTimeMs}ms.`
    });
  } else {
    checklist.push({
      label: "Response received",
      status: "pass",
      message: `Received response in ${responseTimeMs}ms.`
    });
  }

  const hasFailures = checklist.some(item => item.status === "fail");
  const status = hasFailures ? "failed" : "passed";

  const requestPreview = isBuyer ? {
    url: config.url || "N/A",
    method: config.method || "N/A",
    headers: config.headers || {},
    body: resolveObjectTokens(config.requestBody || {}, inputTokens),
    params: resolveObjectTokens(config.queryParams || {}, inputTokens)
  } : {
    type: integration.type,
    expected_fields: config.requiredFields || []
  };

  const finalRawResponse = status === "passed" ? rawResponse : {
    error: "Validation Error",
    details: checklist.filter(i => i.status === "fail").map(i => i.message)
  };

  return {
    id: createId("test"),
    integrationId: integration.id,
    status,
    requestPreview,
    rawResponse: finalRawResponse,
    parsedResult: status === "passed" ? parsedResult : {},
    checklist,
    responseTimeMs,
    createdAt: new Date().toISOString()
  };
}
