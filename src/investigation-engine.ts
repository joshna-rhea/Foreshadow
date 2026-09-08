import type { ShootDay } from "./model.js";
import type { AssumptionAttack } from "./assumption-engine.js";


export type InvestigationTarget = {
  id: string;
  assumptionId: string;

  category:
    | "DAYLIGHT"
    | "WEATHER"
    | "ACCESS";

  priority: "CRITICAL" | "HIGH" | "MEDIUM";

  objective: string;

  evidenceRequirement: string;

  arithmeticPolicy:
    | "MAY_CREATE_HARD_EDGE"
    | "WARNING_ONLY";
};

export function buildInvestigationTargets(
  shootDay: ShootDay,
  attacks: AssumptionAttack[]
): InvestigationTarget[] {
  const targets: InvestigationTarget[] = [];

  for (const attack of attacks) {
    // Already proven assumptions do not need another investigation.
    if (attack.status === "SUPPORTED") {
      continue;
    }

    // Schedule buffer is internal deterministic math,
    // not something Parallel should search the web for.
    if (attack.category === "SCHEDULE") {
      continue;
    }

    if (attack.category === "DAYLIGHT") {
      targets.push({
        id: `investigate-${attack.id}`,
        assumptionId: attack.id,
        category: "DAYLIGHT",
        priority: attack.priority,

        objective:
          `Verify the daylight-end boundary for ${shootDay.location} on ${shootDay.date}.`,

        evidenceRequirement:
          "An explicit sunset or usable-light end time tied to the exact shoot date and location.",

        arithmeticPolicy: "MAY_CREATE_HARD_EDGE"
      });

      continue;
    }

    if (attack.category === "ACCESS") {
      targets.push({
        id: `investigate-${attack.id}`,
        assumptionId: attack.id,
        category: "ACCESS",
        priority: attack.priority,

        objective:
       `Verify whether ${shootDay.venue ?? shootDay.location} in ${shootDay.location} has a closing time, permit expiry, or access restriction affecting ${shootDay.date}.`,

        evidenceRequirement:
          "An explicit closing time, permit expiry time, or access restriction tied to the location.",

        arithmeticPolicy: "MAY_CREATE_HARD_EDGE"
      });

      continue;
    }

    if (attack.category === "WEATHER") {
      targets.push({
        id: `investigate-${attack.id}`,
        assumptionId: attack.id,
        category: "WEATHER",
        priority: attack.priority,

        objective:
          `Investigate weather risk for ${shootDay.location} on ${shootDay.date}, prioritizing evidence of actual operational interruption rather than probability alone.`,

        evidenceRequirement:
          "An explicit operational interruption, safety restriction, or evidence-backed duration. Rain probability alone is insufficient for delay arithmetic.",

        arithmeticPolicy: "WARNING_ONLY"
      });
    }
  }

  return targets;
}

const PRIORITY_SCORE = {
  CRITICAL: 3,
  HIGH: 2,
  MEDIUM: 1
} as const;

export function selectInvestigationTargets(
  targets: InvestigationTarget[],
  maxTargets: number
): InvestigationTarget[] {
  if (maxTargets <= 0) {
    return [];
  }

  return [...targets]
    .sort((a, b) => {
      const priorityDifference =
        PRIORITY_SCORE[b.priority] -
        PRIORITY_SCORE[a.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return a.id.localeCompare(b.id);
    })
    .slice(0, maxTargets);
}
