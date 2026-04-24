export type SupportedLanguage = "en" | "sw";

export interface ServiceHealth {
  status: "ok" | "degraded";
  timestamp: string;
  service: string;
}
