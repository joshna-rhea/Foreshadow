import {
  selectInvestigationTargets,
  type InvestigationTarget
} from "./investigation-engine.js";

function assertEqual<T>(
  actual: T,
  expected: T,
  message: string
) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${expected}, got ${actual}`
    );
  }
}

const targets: InvestigationTarget[] = [
  {
    id: "weather",
    assumptionId: "weather-continuity",
    category: "WEATHER",
    priority: "HIGH",
    objective: "Check weather",
    evidenceRequirement: "Operational weather evidence",
    arithmeticPolicy: "WARNING_ONLY"
  },
  {
    id: "access",
    assumptionId: "location-access",
    category: "ACCESS",
    priority: "CRITICAL",
    objective: "Check access",
    evidenceRequirement: "Explicit access boundary",
    arithmeticPolicy: "MAY_CREATE_HARD_EDGE"
  },
  {
    id: "daylight",
    assumptionId: "daylight-edge",
    category: "DAYLIGHT",
    priority: "MEDIUM",
    objective: "Check daylight",
    evidenceRequirement: "Explicit sunset time",
    arithmeticPolicy: "MAY_CREATE_HARD_EDGE"
  }
];

const selected =
  selectInvestigationTargets(
    targets,
    2
  );

assertEqual(
  selected.length,
  2,
  "Budget of 2 should select exactly 2 targets"
);

assertEqual(
  selected[0]?.id,
  "access",
  "CRITICAL target should be selected first"
);

assertEqual(
  selected[1]?.id,
  "weather",
  "HIGH target should be selected before MEDIUM"
);

const none =
  selectInvestigationTargets(
    targets,
    0
  );

assertEqual(
  none.length,
  0,
  "Zero investigation budget should select no targets"
);

console.log(
  "All investigation engine tests passed"
);
