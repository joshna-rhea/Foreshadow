import type { ShootDay } from "./model.js";

export const shootDay: ShootDay = {
    projectName: "Foreshadow Demo Shoot",
    date: "2026-08-24",
    location: "Chennai, India",
    venue: "Semmozhi Poonga",
    timezone: "Asia/Kolkata",

    scheduledstart: "16:00",
    scheduledend: "18:14",

    hardboundary: {
        type: "sunset",
        time: "18:25",
        source: "demo-reference"
    }
};
