export type ShootDay = {
    projectName: string;
    date: string;
    location: string;
    venue?: string;
    timezone: string;
    scheduledstart: string;
    scheduledend: string;
    hardboundary: {
       type:  string;
       time: string;
       source: string;
    };
};

export type ExternalFact = {
    type: string;
    value: string;
    sourceUrl: string;
    retreivedAt: string;
    usableForMath: boolean;
    rejectionReason?: string;

}

export type HardEdgeType =
| "DAYLIGHT_END"
| "LOCATION_CLOSE"
| " ACTOR_HARD_OUT"
| "PERMIT_EXPIRY"

export type HardEdgeFact = {
    edgeType: HardEdgeType;
    value: string;
   // The real-world evidence this hard edge came from.
    sourceFact: ExternalFact;
};

export function timeToMinutes(time: string): number {
    const [hours,minutes] = time.split(":").map(Number);

    if (hours === undefined || minutes === undefined){
        throw new Error(`Invalid time: ${time}`);
    }
    return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string{
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2,"0")}`;
}
