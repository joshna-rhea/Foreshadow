type DisruptionOrigin = "SCENARIO" | "EVIDENCE";

type Disruption = {
    name: string;
    minutes: number;
    origin?: DisruptionOrigin;
    sourceUrl?: string;
};

type FailureSetResult = {
    disruptions: Disruption[];
    totalDelayMinutes: number;
    breachMinutes: number;
};

type FailureChainResult = {
    baselineEndMinutes: number;
    disruptions: {
        name: string;
        minutes: number;
        cumulativeDelayMinutes: number;
        projectedEndMinutes: number;
    }[];
    hardBoundaryMinutes: number;
    finalProjectedEndMinutes: number;
    breachMinutes: number;
};

type InterventionOrigin = "SCENARIO" | "AGENT";

type Intervention = {
    name: string;
    minutesRecovered: number;
    origin: InterventionOrigin;
};

type HardeningResult = {
    intervention: Intervention;

    originalSlackMinutes: number;
    hardenedSlackMinutes: number;

    originalMinimumFailureSets: FailureSetResult[];
    newMinimumFailureSets: FailureSetResult[];

    eliminatedOriginalFailureSets: number;
    allOriginalMinimumFailureSetsEliminated: boolean;
};

type SurvivalFrontierPoint = {
    disruptionAMinutes: number;
    disruptionBMinutes: number;
    totalDelayMinutes: number;
    remainingSlackMinutes: number;
    outcome: "SURVIVES" | "FAILS";
};

type SurvivalFrontierResult ={
    slackMinutes: number;
    disruptionAName: string;
    disruptionBName: string;
    points: SurvivalFrontierPoint[];
};

 function calculateSlack(
    scheduledEndMinutes: number,
    hardBoundaryMinutes : number
): number {
    return hardBoundaryMinutes - scheduledEndMinutes;
}

function getRiskStatus (slackMinutes: number): "SAFE" | "AT RISK" | "BROKEN"{
    if (slackMinutes < 0) {
        return "BROKEN";
    }
    if (slackMinutes <= 15){
        return "AT RISK";
    }
    return "SAFE";
}


function applyDisruption(
    slackMinutes: number,
    disruptionMinutes: number
): number {
    return slackMinutes - disruptionMinutes;
}

function findMinimumFailureSets(
    slackMinutes: number,
    disruptions: Disruption[]
): FailureSetResult []{
    const failureSets: FailureSetResult [] = [];

    function search(
        startIndex: number,
        current: Disruption[],
        targetSize: number
    ) : void{
        if (current.length === targetSize){
            const totalDelayMinutes = current.reduce(
                (sum, disruption) => sum + disruption.minutes,
                0
            );

            // Equal to slack = boundary, NOT failure.
            if (totalDelayMinutes > slackMinutes) {
                failureSets.push( {
                    disruptions: [...current],
                    totalDelayMinutes,
                    breachMinutes: totalDelayMinutes - slackMinutes
                });
            }

          return;

        }
        for ( let i = startIndex; i< disruptions.length; i++) {
            const disruption = disruptions[i];

              if (!disruption) {
                   continue;
               }

              current.push(disruption);
              search(i+1, current, targetSize);
              current.pop();
            }
        }

    for (let size = 1; size <= disruptions.length; size++){
    search(0, [], size);

     // Stop once we find failure sets with the minimum number of disruptions.
    if (failureSets.length > 0){
        break;
      }
    }

    return failureSets;
}

function buildFailureChain(
    scheduledEndMinutes: number,
    hardBoundaryMinutes: number,
    failureSet: FailureSetResult
): FailureChainResult {
    let cumulativeDelayMinutes = 0;

    const disruptionSteps = failureSet.disruptions.map((disruption) => {
        cumulativeDelayMinutes += disruption.minutes;

        return{
            name: disruption.name,
            minutes: disruption.minutes,
            cumulativeDelayMinutes,
            projectedEndMinutes:
                  scheduledEndMinutes + cumulativeDelayMinutes
        };
    });

    const finalProjectedEndMinutes =
        scheduledEndMinutes + failureSet.totalDelayMinutes;

        return{
            baselineEndMinutes: scheduledEndMinutes,
            disruptions: disruptionSteps,
            hardBoundaryMinutes,
            finalProjectedEndMinutes,
            breachMinutes:
                 finalProjectedEndMinutes - hardBoundaryMinutes
        };

}

function evaluateHardening(
    slackMinutes: number,
    disruptions: Disruption[],
    intervention: Intervention

): HardeningResult {

    const originalMinimumFailureSets =
    findMinimumFailureSets(
        slackMinutes,
        disruptions
    );

    const hardenedSlackMinutes =
        slackMinutes + intervention.minutesRecovered;

    const survivingOriginalFailureSets =
         originalMinimumFailureSets.filter(
            (failureSet) =>
                 failureSet.totalDelayMinutes >
                 hardenedSlackMinutes
         );

         const eliminatedOriginalFailureSets =
               originalMinimumFailureSets.length -
               survivingOriginalFailureSets.length;

         const newMinimumFailureSets =
             findMinimumFailureSets(
                hardenedSlackMinutes,
                disruptions
             );

         return {
            intervention,
            originalSlackMinutes: slackMinutes,
            hardenedSlackMinutes,

            originalMinimumFailureSets,
            newMinimumFailureSets,

            eliminatedOriginalFailureSets,

            allOriginalMinimumFailureSetsEliminated:
                 originalMinimumFailureSets.length > 0 &&
                 survivingOriginalFailureSets.length === 0
         };
}

function buildSurvivalFrontier(
    slackMinutes: number,
    disruptionAName: string,
    disruptionBName: string,
    maxMinutes: number,
    stepMinutes: number
): SurvivalFrontierResult {

    const points: SurvivalFrontierPoint[] = [];

    for (
        let disruptionAMinutes = 0;
        disruptionAMinutes <= maxMinutes;
        disruptionAMinutes += stepMinutes
    ) {
        for (
            let disruptionBMinutes = 0;
            disruptionBMinutes <= maxMinutes;
            disruptionBMinutes += stepMinutes
        ) {
            const totalDelayMinutes =
                disruptionAMinutes + disruptionBMinutes;

            const remainingSlackMinutes =
                slackMinutes - totalDelayMinutes;

            points.push({
                disruptionAMinutes,
                disruptionBMinutes,
                totalDelayMinutes,
                remainingSlackMinutes,
                outcome:
                    totalDelayMinutes > slackMinutes
                        ? "FAILS"
                        : "SURVIVES"
            });
        }
    }

    return {
        slackMinutes,
        disruptionAName,
        disruptionBName,
        points
    };
}

export type{
    Disruption,
    DisruptionOrigin,
    FailureSetResult,
    FailureChainResult,
    Intervention,
    InterventionOrigin,
    HardeningResult,
    SurvivalFrontierPoint,
    SurvivalFrontierResult
};

export {
    calculateSlack,
    getRiskStatus,
    applyDisruption,
    findMinimumFailureSets,
    buildFailureChain,
    evaluateHardening,
    buildSurvivalFrontier
};
