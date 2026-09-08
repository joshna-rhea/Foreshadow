import { timeToMinutes } from "./model.js";
import {
  type Disruption,
  calculateSlack,
  getRiskStatus,
  applyDisruption,
  findMinimumFailureSets
} from "./risk-engine.js";
import {shootDay} from "./demo-shoot.js";


const scheduledEnd = timeToMinutes(shootDay.scheduledend);
const boundaryTime = timeToMinutes(shootDay.hardboundary.time);
const slack = calculateSlack(scheduledEnd, boundaryTime);
const status = getRiskStatus(slack);
const setupDelay = 7;
const weatherHold = 5;
const remainingSlack = applyDisruption(slack, setupDelay);
const disruptedStatus = getRiskStatus(remainingSlack);
const combinedDelay = setupDelay + weatherHold;
const combinedSlack = applyDisruption(slack, combinedDelay);
const combinedStatus = getRiskStatus(combinedSlack);
const disruptions: Disruption[] = [
    { name: "Setup delay", minutes: 7 },
    { name: "Weather hold", minutes: 5},
    { name: "Late start", minutes: 4}
];
const minimumFailureSets = findMinimumFailureSets(slack, disruptions);
console.log("\nMinimum Failure Sets:");

for (const set of minimumFailureSets) {
    console.log(
        `${set.disruptions.map(d => d.name).join(" + ")} = ` +
        `${set.totalDelayMinutes} minutes ` +
        `(breach +${set.breachMinutes} minutes)`
    );
}

console.log(`Operational slack: ${slack} minutes`);
console.log(`Status: ${status}`);
console.log(`Setup delay: ${setupDelay} minutes`);
console.log(`Remaining slack: ${remainingSlack} minutes`);
console.log(`After disruption: ${disruptedStatus}`);
console.log(`Weather hold: ${weatherHold} minutes`);
console.log(`Combined delay: ${combinedDelay} minutes`);
console.log(`combined slack: ${combinedSlack} minutes`);
console.log(`Combined status: ${combinedStatus}`);
