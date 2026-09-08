import { runLivePreflight } from "./parallel.js";
import { minutesToTime } from "./model.js";

async function main() {
  const result = await runLivePreflight();

  if (!result) {
    throw new Error("Live preflight returned no result");
  }

  const frontierSummary = result.survivalFrontier
    ? {
        disruptionA: result.survivalFrontier.disruptionAName,
        disruptionB: result.survivalFrontier.disruptionBName,

        boundarySurvives:
          result.survivalFrontier.points.find(
            (point) =>
              point.disruptionAMinutes === 7 &&
              point.disruptionBMinutes === 4
          ) ?? null,

        firstFailure:
          result.survivalFrontier.points.find(
            (point) =>
              point.disruptionAMinutes === 7 &&
              point.disruptionBMinutes === 5
          ) ?? null
      }
    : null;

  const primaryFailureSet =
    result.minimumFailureSets[0] ?? null;

  const hardenedFailureSet =
    result.hardening?.newMinimumFailureSets[0] ?? null;

  const decisionSummary = {
    verdict: result.status,

    distanceToFailureMinutes:
      result.slackMinutes,

    hardEdge:
      `${result.hardEdge.edgeType} at ${result.hardEdge.value}`,

    nearestFailure: primaryFailureSet
      ? {
          disruptions:
            primaryFailureSet.disruptions.map(
              (disruption) => disruption.name
            ),

          totalDelayMinutes:
            primaryFailureSet.totalDelayMinutes,

          breachMinutes:
            primaryFailureSet.breachMinutes
        }
      : null,

    protectThis: result.hardening
      ? {
          intervention:
            result.hardening.intervention.name,

          minutesRecovered:
            result.hardening.intervention.minutesRecovered,

          distanceBefore:
            result.hardening.originalSlackMinutes,

          distanceAfter:
            result.hardening.hardenedSlackMinutes,

          minimumFailureOrderBefore:
            primaryFailureSet?.disruptions.length ?? null,

          minimumFailureOrderAfter:
            hardenedFailureSet?.disruptions.length ?? null,

          originalFailureSetsEliminated:
            result.hardening.eliminatedOriginalFailureSets
        }
      : null,

    investigations: {
      budget:
        result.investigationBudget,

      selected:
        result.selectedInvestigationTargets.map(
          (target) => target.id
        ),

      skipped:
        result.skippedInvestigationTargets.map(
          (target) => target.id
        )
    }
  };

  const displayResult = {
    ...result,

    decisionSummary,

    failureChains: result.failureChains.map((chain) => ({
      baselineEnd:
        minutesToTime(chain.baselineEndMinutes),

      disruptions:
        chain.disruptions.map((disruption) => ({
          name: disruption.name,
          minutes: disruption.minutes,
          cumulativeDelayMinutes:
            disruption.cumulativeDelayMinutes,
          projectedEnd:
            minutesToTime(disruption.projectedEndMinutes)
        })),

      hardBoundary:
        minutesToTime(chain.hardBoundaryMinutes),

      finalProjectedEnd:
        minutesToTime(chain.finalProjectedEndMinutes),

      breachMinutes:
        chain.breachMinutes
    })),

    survivalFrontier:
      frontierSummary
  };

  console.log(
    "\n=== FORESHADOW LIVE PREFLIGHT ==="
  );

  console.dir(
    displayResult,
    { depth: null }
  );
}

main().catch((error) => {
  console.error(
    "\nFORESHADOW live preflight failed:"
  );

  console.error(error);

  process.exitCode = 1;
});
