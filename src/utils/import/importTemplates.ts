export type ImportTemplateKey =
  | "buyer_rtb"
  | "static_buyer"
  | "publisher_rtb"
  | "mixed"
  | "direct_number"
  | "direct_sip"
  | "mixed_direct_rtb"
  | "json";

export const IMPORT_TEMPLATES: Record<ImportTemplateKey, { label: string; fileName: string; content: string }> = {
  buyer_rtb: {
    label: "Buyer RTB CSV",
    fileName: "buyer-rtb-template.csv",
    content: "integration_name,campaign,direction,type,platform_preset,method,url,timeout_seconds,required_fields,accepted_path,accepted_value,destination_number_path,bid_path,conversion_duration_path,reject_reason_path\nPremier RTB,HVAC Inbound,buyer,rtb,ringba_rtb,POST,https://buyer.example/ping,3,\"caller_id,zip\",$.accepted,true,$.phone_number,$.bid,$.duration,$.reason"
  },
  direct_number: {
    label: "Direct Number Target CSV",
    fileName: "direct-number-target-template.csv",
    content: "integration_name,campaign,direction,type,buyer_destination_kind,target_mode,number,connection_timeout_seconds,recordings,revenue_recovery,schedule_timezone,schedule_mode,cap_on,daily_cap,concurrency_cap,duplicate_mode,payout,conversion_duration_seconds\nAcme Direct Number,HVAC Inbound,buyer,static_number,direct_number,number,+18005551212,30,account_default,buyer_default,America/New_York,always_open,converted_calls,100,5,buyer_default,35,120"
  },
  direct_sip: {
    label: "Direct SIP Target CSV",
    fileName: "direct-sip-target-template.csv",
    content: "integration_name,campaign,direction,type,buyer_destination_kind,target_mode,sip_address,sip_headers_json,connection_timeout_seconds,recordings,revenue_recovery,schedule_timezone,schedule_mode,cap_on,daily_cap,concurrency_cap,duplicate_mode,payout,conversion_duration_seconds\nAcme Direct SIP,HVAC Inbound,buyer,sip,direct_sip,sip,sip:buyer@example.com,\"{\"\"X-Buyer\"\":\"\"acme\"\"}\",30,account_default,buyer_default,America/New_York,always_open,converted_calls,100,5,buyer_default,35,120"
  },
  mixed_direct_rtb: {
    label: "Mixed Direct + RTB Buyer CSV",
    fileName: "mixed-direct-rtb-template.csv",
    content: "integration_name,campaign,direction,type,buyer_destination_kind,number,sip_address,url,method,daily_cap,concurrency_cap,payout,conversion_duration_seconds,schedule_timezone,schedule_mode\nAcme Direct Number,HVAC Inbound,buyer,static_number,direct_number,+18005551212,,,,100,5,35,120,America/New_York,always_open\nPremier RTB Endpoint,HVAC Inbound,buyer,rtb,rtb,,,https://buyer.example/ping,POST,,,,,America/New_York,basic"
  },
  static_buyer: {
    label: "Static Buyer CSV",
    fileName: "static-buyer-template.csv",
    content: "integration_name,campaign,direction,type,destination_number,payout,conversion_duration_seconds\nStatic Buyer,HVAC Inbound,buyer,static_number,+18005551212,25,60"
  },
  publisher_rtb: {
    label: "Publisher RTB CSV",
    fileName: "publisher-rtb-template.csv",
    content: "integration_name,campaign,direction,type,platform_preset,publisher_id,posting_url,required_fields,expires_in_seconds\nABC Publisher,HVAC Inbound,publisher,rtb,publisher_rtb,pub_abc,https://mock-ppcall.local/rtb/camp_hvac/pub_abc,\"caller_id,zip\",30"
  },
  mixed: {
    label: "Mixed CSV",
    fileName: "mixed-integrations-template.csv",
    content: "integration_name,campaign,direction,type,platform_preset,method,url,destination_number,publisher_id,posting_url,timeout_seconds,expires_in_seconds,payout,conversion_duration_seconds,required_fields,accepted_path,accepted_value,destination_number_path,bid_path,reject_reason_path\nPremier RTB,HVAC Inbound,buyer,rtb,ringba_rtb,POST,https://buyer.example/ping,,,3,,,60,\"caller_id,zip\",$.accepted,true,$.phone_number,$.bid,$.reason\nPublisher RTB,HVAC Inbound,publisher,rtb,publisher_rtb,,,,pub_abc,https://mock-ppcall.local/rtb/camp_hvac/pub_abc,,30,,,\"caller_id,zip\",,,,,"
  },
  json: {
    label: "JSON",
    fileName: "integrations-template.json",
    content: JSON.stringify([
      {
        integration_name: "Premier RTB",
        campaign: "HVAC Inbound",
        direction: "buyer",
        type: "rtb",
        platform_preset: "ringba_rtb",
        method: "POST",
        url: "https://buyer.example/ping",
        timeout_seconds: 3,
        required_fields: "caller_id,zip",
        accepted_path: "$.accepted",
        accepted_value: true,
        destination_number_path: "$.phone_number",
        bid_path: "$.bid"
      }
    ], null, 2)
  }
};
