import { LlmAgent, InMemoryRunner} from "@google/adk";

import type { ShootDay } from "./model.js";

import type {
  InvestigationTarget
} from "./investigation-engine.js";


const rankerAgent = new LlmAgent({
  name: "foreshadow_investigation_ranker",

  model: "gemini-3.6-flash",

  instruction: `
You are FORESHADOW's investigation-ranking agent.

Your job is only to rank existing investigation targets
by which should be investigated first for operational risk.

Rules:
- Never invent new target IDs.
- Never invent weather, access, permit, or daylight facts.
- Never calculate schedule risk or delay arithmetic.
- Do not replace Parallel Search.
- Only rank the supplied target IDs.
- Prefer targets that could reveal a hard operational boundary.
- Return ONLY a JSON array of target IDs, in ranked order.

Example:
["investigate-location-access","investigate-weather-continuity"]
`
});


const runner = new InMemoryRunner({
  agent: rankerAgent,
  appName: "foreshadow"
});


export async function rankInvestigationTargets(
  shootDay: ShootDay,
  targets: InvestigationTarget[]
): Promise<string[]> {

  if (targets.length === 0) {
    return [];
  }

  const session =
    await runner.sessionService.createSession({
      appName: "foreshadow",
      userId: "foreshadow-ranker"
    });

  const prompt = JSON.stringify({
    shootDay,
    targets: targets.map((target) => ({
      id: target.id,
      category: target.category,
      priority: target.priority,
      objective: target.objective,
      evidenceRequirement:
        target.evidenceRequirement,
      arithmeticPolicy:
        target.arithmeticPolicy
    }))
  });

  let responseText = "";

  for await (
    const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,

      newMessage: {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    })
  ) {
    if (!event.content?.parts) {
      continue;
    }

    for (const part of event.content.parts) {
      if ("text" in part && part.text) {
        responseText += part.text;
      }
    }
  }

  if (!responseText.trim()) {
    throw new Error(
      "Gemini returned no investigation ranking"
    );
  }

  const parsed = JSON.parse(
    responseText.trim()
  );

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Gemini ranking was not an array"
    );
  }

  const allowedIds =
    new Set(
      targets.map((target) => target.id)
    );

  const rankedIds: string[] = [];

  for (const value of parsed) {
    if (
      typeof value === "string" &&
      allowedIds.has(value) &&
      !rankedIds.includes(value)
    ) {
      rankedIds.push(value);
    }
  }

  if (rankedIds.length === 0) {
    throw new Error(
      "Gemini returned no valid target IDs"
    );
  }

  // If Gemini omitted any targets,
  // append them deterministically.
  for (const target of targets) {
    if (!rankedIds.includes(target.id)) {
      rankedIds.push(target.id);
    }
  }

  return rankedIds;
}

