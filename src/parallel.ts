import { Parallel } from "parallel-web";

import {
  sunsetFactFromResult,
  weatherFactFromResult,
  accessFactFromResult,
  type WeatherEvidence,
  type AccessEvidence
} from "./evidence.js";

import { shootDay } from "./demo-shoot.js";

import {
  type Disruption,
  type Intervention
} from "./risk-engine.js";

import { runPreflight } from "./preflight.js";

import {
  type HardEdgeFact,
  type ExternalFact
} from "./model.js";

import {
  buildAssumptionAttacks
} from "./assumption-engine.js";

import {
  buildInvestigationTargets,
  selectInvestigationTargets,
  type InvestigationTarget
} from "./investigation-engine.js";

const client = new Parallel({
  apiKey: process.env.PARALLEL_API_KEY
});


 export async function runLivePreflight() {

  // --------------------------------------------------
  // 1. BOOTSTRAP HARD EDGE
  // Daylight is used to establish the first hard edge.
  // --------------------------------------------------


    const sunsetResults = await client.search({
    objective:
      `Find an explicit source stating the sunset time in ${shootDay.location} on ${searchDate}. Prefer a result that includes the exact date and sunset time in the returned excerpt.`,

    search_queries: [
      `"${searchDate}" "${shootDay.location}" sunset`
    ],

    mode: "basic",

    advanced_settings: {
      max_results: 3,
      excerpt_settings: {
        max_chars_per_result: 1500
      }
    }
  });

   let validatedSunsetFact: ExternalFact | null = null;

  for (const result of sunsetResults.results) {
    const fact = sunsetFactFromResult(
      result,
      shootDay.date
    );

    console.log("Sunset evidence:", fact);

    if (fact.usableForMath) {
      validatedSunsetFact = fact;
      break;
    }
  }

      console.log(
    "Validated sunset fact:",
    validatedSunsetFact
  );

  if (!validatedSunsetFact) {
    throw new Error(
      "FORESHADOW could not validate a daylight hard edge"
    );
  }


  // --------------------------------------------------
  // 2. TESTED DISRUPTION SCENARIOS
  // --------------------------------------------------


     const disruptions: Disruption[] = [
    {
      name: "Setup delay",
      minutes: 7,
      origin: "SCENARIO"
    },
    {
      name: "Lighting reset",
      minutes: 5,
      origin: "SCENARIO"
    },
    {
      name: "Late start",
      minutes: 4,
      origin: "SCENARIO"
    }
  ];



  // --------------------------------------------------
  // 3. TESTED HARDENING INTERVENTION
  // --------------------------------------------------

  const intervention: Intervention = {
    name: "Pre-stage lighting",
    minutesRecovered: 4,
    origin: "SCENARIO"
  };

  // --------------------------------------------------
  // 4. BUILD THE BOOTSTRAP HARD EDGE
  // --------------------------------------------------

  const daylightHardEdge: HardEdgeFact = {
    edgeType: "DAYLIGHT_END",
    value: validatedSunsetFact.value,
    sourceFact: validatedSunsetFact
  };


  // --------------------------------------------------
  // 5. DETERMINISTIC PREFLIGHT
  // --------------------------------------------------

  const preflightResult = runPreflight(
    shootDay,
    daylightHardEdge,
    disruptions,
    intervention
  );


  // --------------------------------------------------
  // 6. INITIAL ASSUMPTION ATTACK
  //
  // Weather and access begin as unverified.
  // FORESHADOW uses that uncertainty to decide
  // what deserves investigation.
  // --------------------------------------------------

  const initialAssumptionAttacks =
    buildAssumptionAttacks(
      shootDay,
      daylightHardEdge,
      preflightResult.slackMinutes,
      false,
      false
    );


  // --------------------------------------------------
  // 7. DERIVE INVESTIGATION TARGETS
  // --------------------------------------------------

  const investigationTargets =
    buildInvestigationTargets(
      shootDay,
      initialAssumptionAttacks
    );

  const INVESTIGATION_BUDGET = 2;

const selectedInvestigationTargets =
  selectInvestigationTargets(
    investigationTargets,
    INVESTIGATION_BUDGET
  );

const skippedInvestigationTargets =
  investigationTargets.filter(
    (target) =>
      !selectedInvestigationTargets.some(
        (selected) => selected.id === target.id
      )
  );


  console.log(
    "Investigation targets:",
    investigationTargets
  );

  // --------------------------------------------------
  // 8. TARGET-DRIVEN PARALLEL INVESTIGATION
  // --------------------------------------------------

  const weatherEvidence: WeatherEvidence[] = [];
  const accessEvidence: AccessEvidence[] = [];

  let validatedWeatherFact: WeatherEvidence | null = null;
  let validatedAccessFact: AccessEvidence | null = null;


 for (const target of selectedInvestigationTargets) {

    console.log(
      `Investigating target: ${target.id}`
    );

    const targetResults = await client.search({
      objective: target.objective,

      search_queries:
        searchQueriesForTarget(target),

      mode: "basic",

      advanced_settings: {
        max_results: 3,
        excerpt_settings: {
          max_chars_per_result: 1500
        }
      }
    });

    // ---------------- WEATHER ----------------

    if (target.category === "WEATHER") {

      for (const result of targetResults.results) {

        const fact = weatherFactFromResult(
          result,
          shootDay.date
        );

        weatherEvidence.push(fact);

        console.log(
          "Weather evidence:",
          fact
        );

        if (fact.usableForMath) {
          validatedWeatherFact = fact;
          break;
        }
      }

      continue;
    }

    // ---------------- ACCESS ----------------

    if (target.category === "ACCESS") {

      for (const result of targetResults.results) {

        const fact =
          accessFactFromResult(result);

        accessEvidence.push(fact);

        console.log(
          "Access evidence:",
          fact
        );

        if (fact.usableForMath) {
          validatedAccessFact = fact;
          break;
        }
      }

      continue;
    }
  }


  // --------------------------------------------------
  // 9. RE-ATTACK ASSUMPTIONS USING NEW EVIDENCE
  // --------------------------------------------------

  const assumptionAttacks =
    buildAssumptionAttacks(
      shootDay,
      daylightHardEdge,
      preflightResult.slackMinutes,

      validatedWeatherFact?.usableForMath === true,

      validatedAccessFact?.usableForMath === true
    );

  const warningOnlyWeatherFact =
    weatherEvidence.find(
    (fact) => fact.warningOnly === true
  ) ?? null;




    // --------------------------------------------------
  // 10. FINAL RESULT
  // --------------------------------------------------

  return {
    ...preflightResult,

    assumptionAttacks,

   investigationTargets,
   selectedInvestigationTargets,
   skippedInvestigationTargets,
   investigationBudget: INVESTIGATION_BUDGET,

    evidence: {

      sunset: {
        status: "USED",
        fact: validatedSunsetFact
      },

     weather: {
  status:
    validatedWeatherFact
      ? "USED"
      : warningOnlyWeatherFact
        ? "WARNING_ONLY"
        : "REJECTED",

  fact:
    validatedWeatherFact ??
    warningOnlyWeatherFact ??
    weatherEvidence[0] ??
    null
},

      access: {
        status:
          validatedAccessFact
            ? "USED"
            : "REJECTED",

        fact:
          validatedAccessFact ??
          accessEvidence[0] ??
          null
      }
    }
  };
}


// --------------------------------------------------
// INVESTIGATION TARGET → SEARCH QUERIES
// --------------------------------------------------

function searchQueriesForTarget(
  target: InvestigationTarget
): string[] {

  const venue =
    shootDay.venue ??
    shootDay.location;

  switch (target.category) {

    case "WEATHER":
      return [
        `"${searchDate}" "${shootDay.location}" weather operational interruption`,
        `"${searchDate}" "${shootDay.location}" filming weather restriction`,
        `"${searchDate}" "${shootDay.location}" rain precipitation`
      ];

    case "ACCESS":
      return [
        `"${venue}" closing time`,
        `"${venue}" opening hours`,
        `"${venue}" access restrictions`
      ];

      case "DAYLIGHT":
      return [
        `"${searchDate}" "${shootDay.location}" sunset`
      ];
  }
}


// --------------------------------------------------
// DATE FORMATTER
// --------------------------------------------------

function formatDateForSearch(
  date: string
): string {

  const [year, month, day] =
    date.split("-");

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];


   return `${Number(day)} ${monthNames[Number(month)]} ${year}`;
}


const searchDate =
  formatDateForSearch(shootDay.date);
