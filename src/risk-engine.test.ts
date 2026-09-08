import {
    calculateSlack,
    getRiskStatus,
    applyDisruption,
    findMinimumFailureSets,
    evaluateHardening,
    buildSurvivalFrontier,
    type Intervention,
    type Disruption,
    type SurvivalFrontierResult,
    buildFailureChain,
} from "./risk-engine.js";



function assertEqual<T>(actual: T, expected: T, message: string){
    if (actual !== expected){
        throw new Error(`${message}: expected ${expected}, got ${actual}`);

    }
}

// 1. SAFE
assertEqual(getRiskStatus(30), "SAFE", "30 min slack should be SAFE");

// 2. AT RISK
assertEqual(getRiskStatus(10), "AT RISK", "10 min slack should be AT RISK");

// 3. BROKEN
assertEqual(getRiskStatus(-1),"BROKEN", "Negative slack should be BROKEN");

// 4. Zero slack is still AT RISK, not BROKEN
assertEqual(getRiskStatus(0), "AT RISK", "Zero slack should be AT RISK");

// 5. Exact disruption equal to slack does not break
assertEqual(applyDisruption(10,10), 0, "Disruption equal to slack should leave zero slack");

// 6. Slack calculation
assertEqual(calculateSlack(17 *60 + 49, 18 * 60), 11, "17:49 to 18:00 should give 11 minutes slack");

// 7. Minimum failure set
const disruptions: Disruption[] = [
    {name: "Setup delay", minutes: 7},
    {name: "Weather hold", minutes: 5},
    {name: "Late start", minutes:4}
];

const failureSets = findMinimumFailureSets(11, disruptions);
assertEqual(failureSets.length, 1," there should be one minimum failure set");

const firstFailureSet = failureSets[0];

if (!firstFailureSet) {
    throw new Error ("Expected at least one minimum failure set");
}

assertEqual(
    firstFailureSet?.totalDelayMinutes,
    12,
    "Minimum failure set should total 12 minutes"
);

assertEqual(
    firstFailureSet?.breachMinutes,
    1,
    "Minimum failure set should breach slack by 1 minute"
);

assertEqual(
    firstFailureSet?.disruptions.length,
    2,
    "Minimum failure set should contain 2 disruptions"
);

// 8. Hardening Intervention
const intervention: Intervention = {
    name: "Pre-stage lighting",
    minutesRecovered: 4,
    origin: "SCENARIO"
};

const hardeningResult = evaluateHardening(
    11,
    disruptions,
    intervention
);

assertEqual(
    hardeningResult.originalSlackMinutes,
    11,
    "Original slack should be 11 minutes"
);

assertEqual(
    hardeningResult.hardenedSlackMinutes,
    15,
    "Hardening should increase slack to 15 minutes"
);

assertEqual(
    hardeningResult.newMinimumFailureSets.length,
    1,
    "There should be one new minimum failure set"
);

const newFailureSet = hardeningResult.newMinimumFailureSets[0];

if (!newFailureSet) {
    throw new Error("Expected a new minimum failure set");

}

assertEqual(
    newFailureSet.disruptions.length,
    3,
    "After hardening, three disruptions should be required to break the day"
);

assertEqual(
    newFailureSet.totalDelayMinutes,
    16,
    "New minimum failure set should total 16 minutes"
);

assertEqual(
    newFailureSet.breachMinutes,
    1,
    "New minimum failure set should breach hardened slack by 1 minute"
);

/// 9. Survival Frontier
const frontier = buildSurvivalFrontier(
    11,
    "Setup delay",
    "Lighting reset",
    10,
    1
);

const survivesAtBoundary = frontier.points.find(
    (point) =>
        point.disruptionAMinutes === 7 &&
        point.disruptionBMinutes === 4
);

if (!survivesAtBoundary) {
    throw new Error("Expected frontier point 7 + 4");
}

assertEqual(
    survivesAtBoundary.totalDelayMinutes,
    11,
    "7 + 4 should total 11 minutes"
);

assertEqual(
    survivesAtBoundary.outcome,
    "SURVIVES",
    "A delay exactly equal to slack should survive"
);

const failsPastBoundary = frontier.points.find(
    (point) =>
        point.disruptionAMinutes === 7 &&
        point.disruptionBMinutes === 5
);

if (!failsPastBoundary) {
    throw new Error("Expected frontier point 7 + 5");
}

assertEqual(
    failsPastBoundary.totalDelayMinutes,
    12,
    "7 + 5 should total 12 minutes"
);

assertEqual(
    failsPastBoundary.outcome,
    "FAILS",
    "A delay greater than slack should fail"
);

console.log("All risk engine tests passed ");
