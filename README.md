# FORESHADOW

**Production software helps you plan tomorrow. FORESHADOW attacks tomorrow.**

FORESHADOW is an operational red-team agent for film shoots. Instead of creating or optimizing a production schedule, it takes an already committed shoot plan and asks:

> **How much reality can tomorrow survive?**

It investigates hidden assumptions using live external evidence, validates whether that evidence is strong enough for operational arithmetic, and deterministically calculates the shortest path from a viable shoot to failure.

## Live Demo

https://foreshadow-aew0.onrender.com

> The demo is hosted on a free Render instance and may take a short time to wake after inactivity.

## What FORESHADOW Does

Given a locked shoot plan, FORESHADOW:

1. Identifies operational assumptions.
2. Uses a Gemini-powered Google ADK agent to rank which assumptions should be investigated first.
3. Uses the Parallel Search API to retrieve live external evidence.
4. Rejects evidence that is not explicit enough for arithmetic.
5. Calculates operational slack against verified hard boundaries.
6. Finds the minimum combination of disruptions that breaks the schedule.
7. Maps the shoot's survival frontier.
8. Tests interventions that push the nearest failure point farther away.

## Core Outputs

- **Distance to Failure** — remaining operational slack.
- **Hard Edge** — the verified external boundary constraining the shoot.
- **Minimum Failure Set** — the smallest disruption combination that causes failure.
- **Failure Chain** — how disruptions propagate into a boundary breach.
- **Survival Frontier** — combinations that survive versus combinations that fail.
- **Protect This** — an intervention that increases resilience.

## Trust Principle

### NO EVIDENCE → NO ARITHMETIC

FORESHADOW distinguishes between:

- validated evidence that may enter calculations,
- rejected evidence that is visible but excluded,
- assumptions that were not investigated within the current investigation budget.

A probability, vague statement, or source without an explicit operational value is not converted into a numeric delay.

## Demo Scenario

The current demo stress-tests a shoot in Chennai, India.

FORESHADOW validates a daylight hard edge using live evidence and determines:

- Scheduled end: **18:14**
- Verified daylight end: **18:25**
- Operational slack: **11 minutes**
- Risk status: **AT RISK**

Scenario disruptions include:

- Setup delay: **7 min**
- Lighting reset: **5 min**
- Late start: **4 min**

The minimum failure path is:

**Setup delay (7) + Lighting reset (5) = 12 minutes**

Since the shoot has only 11 minutes of slack, the schedule breaches its verified hard boundary by 1 minute.

## Architecture

```text
Locked Shoot Plan
       |
       v
Assumption Attacks
       |
       v
Investigation Targets
       |
       v
Google ADK + Gemini
(ranks existing investigation targets)
       |
       v
Parallel Search API
(live external evidence)
       |
       v
Evidence Validation Gate
       |
       v
Deterministic Risk Engine
       |
       v
Distance to Failure
Minimum Failure Set
Failure Chain
Survival Frontier
Protect This