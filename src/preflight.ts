import {
  type ShootDay,
  type HardEdgeFact,
  timeToMinutes
} from "./model.js";

import {
  type Disruption,
  type FailureSetResult,
  type FailureChainResult,
  type Intervention,
  type HardeningResult,
  type SurvivalFrontierResult,
  calculateSlack,
  getRiskStatus,
  findMinimumFailureSets,
  buildFailureChain,
  evaluateHardening,
  buildSurvivalFrontier
} from "./risk-engine.js";

export type PreflightResult = {
  shootDay: ShootDay;
  hardEdge: HardEdgeFact;
  slackMinutes: number;
  status: "SAFE" | "AT RISK" | "BROKEN";
  hardening: HardeningResult | null;
  survivalFrontier: SurvivalFrontierResult | null;
  minimumFailureSets: FailureSetResult[];
  failureChains: FailureChainResult[];
};

export function runPreflight(
  shootDay: ShootDay,
  hardEdge: HardEdgeFact,
  disruptions: Disruption[],
  intervention?: Intervention
): PreflightResult {
  if (!hardEdge.sourceFact.usableForMath) {
    throw new Error("Hard edge source is not usable for math");
  }

  const scheduledEnd = timeToMinutes(shootDay.scheduledend);
  const boundaryTime = timeToMinutes(hardEdge.value);

  const slackMinutes = calculateSlack(
    scheduledEnd,
    boundaryTime
  );

  const status = getRiskStatus(slackMinutes);

  const minimumFailureSets = findMinimumFailureSets(
    slackMinutes,
    disruptions
  );

  const failureChains = minimumFailureSets.map((failureSet) =>
    buildFailureChain(
      scheduledEnd,
      boundaryTime,
      failureSet
    )
  );

  const hardening = intervention
    ? evaluateHardening(
        slackMinutes,
        disruptions,
        intervention
      )
    : null;

const disruptionA = disruptions[0];
const disruptionB = disruptions[1];

const survivalFrontier =
    disruptionA && disruptionB
        ? buildSurvivalFrontier(
            slackMinutes,
            disruptionA.name,
            disruptionB.name,
            10,
            1
          )
        : null;

  return {
    shootDay,
    hardEdge,
    slackMinutes,
    status,
    minimumFailureSets,
    failureChains,
    hardening,
    survivalFrontier
  };
}
