import type {
  ShootDay,
  HardEdgeFact
} from "./model.js";

export type AssumptionStatus =
  | "SUPPORTED"
  | "UNVERIFIED"
  | "WARNING_ONLY";

export type AssumptionAttack = {
  id: string;
  assumption: string;
  category:
    | "DAYLIGHT"
    | "WEATHER"
    | "ACCESS"
    | "SCHEDULE";

  status: AssumptionStatus;

  reason: string;

  evidenceNeeded?: string;

  priority: "CRITICAL" | "HIGH" | "MEDIUM";
};

export function buildAssumptionAttacks(
  shootDay: ShootDay,
  hardEdge: HardEdgeFact,
  slackMinutes: number,
  weatherEvidenceUsable: boolean,
  accessEvidenceUsable: boolean
): AssumptionAttack[] {

  const attacks: AssumptionAttack[] = [];

  attacks.push({
    id: "daylight-edge",
    assumption:
      `The shoot can finish before the ${hardEdge.edgeType} boundary at ${hardEdge.value}.`,
    category: "DAYLIGHT",
    status: "SUPPORTED",
    reason:
      `Only ${slackMinutes} minutes remain before the hard boundary.`,
    priority:
      slackMinutes <= 15
        ? "CRITICAL"
        : "HIGH"
  });

  attacks.push({
    id: "weather-continuity",
    assumption:
      "Weather will not create an operational interruption.",
    category: "WEATHER",
    status:
      weatherEvidenceUsable
        ? "SUPPORTED"
        : "WARNING_ONLY",
    reason:
      weatherEvidenceUsable
        ? "Quantitative operational weather evidence is available."
        : "Weather may indicate risk, but no evidence-backed delay duration is available.",
    evidenceNeeded:
      weatherEvidenceUsable
        ? undefined
        : "Explicit operational impact or interruption duration",
    priority: "HIGH"
  });

  attacks.push({
    id: "location-access",
    assumption:
      "The location remains accessible for the required shooting window.",
    category: "ACCESS",
    status:
      accessEvidenceUsable
        ? "SUPPORTED"
        : "UNVERIFIED",
    reason:
      accessEvidenceUsable
        ? "Explicit access timing evidence is available."
        : "No explicit closing or access boundary has been validated.",
    evidenceNeeded:
      accessEvidenceUsable
        ? undefined
        : "Explicit closing time, permit expiry, or access restriction",
    priority: "HIGH"
  });

  attacks.push({
    id: "schedule-buffer",
    assumption:
      "The committed schedule contains enough recovery margin.",
    category: "SCHEDULE",
    status:
      slackMinutes > 15
        ? "SUPPORTED"
        : "UNVERIFIED",
    reason:
      `${slackMinutes} minutes of operational slack remain.`,
    priority:
      slackMinutes <= 15
        ? "CRITICAL"
        : "MEDIUM"
  });

  return attacks;
}
