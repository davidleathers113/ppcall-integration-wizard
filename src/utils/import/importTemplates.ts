export type ImportTemplateKey = "buyer_rtb" | "static_buyer" | "publisher_rtb" | "mixed" | "json";

export const IMPORT_TEMPLATES: Record<ImportTemplateKey, { label: string; fileName: string; content: string }> = {
  buyer_rtb: {
    label: "Buyer RTB CSV",
    fileName: "buyer-rtb-template.csv",
    content: "integration_name,campaign,direction,type,platform_preset,method,url,timeout_seconds,required_fields,accepted_path,accepted_value,destination_number_path,bid_path,conversion_duration_path,reject_reason_path\nPremier RTB,HVAC Inbound,buyer,rtb,ringba_rtb,POST,https://buyer.example/ping,3,\"caller_id,zip\",$.accepted,true,$.phone_number,$.bid,$.duration,$.reason"
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
