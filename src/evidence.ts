import type { ExternalFact } from "./model.js";

type ParallelResult = {
    url: string;
    title?: string | null;
    publish_date?: string | null;
    excerpts?: string[];
};
export type WeatherEvidence = {
    condition: string;
    precipitationChance?: number;
    sourceUrl: string;
    retreivedAt: string;
    usableForMath: boolean;
    rejectionReason?: string;
    warningOnly?: boolean;
};

export type AccessEvidence = {
    closingTime: string;
    sourceUrl: string;
    retreivedAt: string;
    usableForMath: boolean;
    rejectionReason?: string;
};

export function sunsetFactFromResult(
    result: ParallelResult,
    expectedDate: string
): ExternalFact {
    const text = result.excerpts?.join(" ") ?? "";
    const cleanText = text.replace(/<[^>]*>/g, "");
    const day = Number(expectedDate.split("-") [2]);
    const month = Number(expectedDate.split("-") [1]);
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
        "December",
    ];

    const expectedDateText = `${day} ${monthNames[month]}`;

    const hasExpectedDate = cleanText
         .toLowerCase()
         .includes(expectedDateText.toLowerCase());

        if (!hasExpectedDate) {
            return{
                type: "sunset",
                value: "",
                sourceUrl: result.url,
                retreivedAt: new Date(). toISOString(),
                usableForMath: false,
                rejectionReason: `Evidence does not explicitly match ${expectedDateText}`,
            };
        }

    const match =
    cleanText.match(/sets at\s+(\d{1,2}:\d{2})/i)??
    cleanText.match(
        /sunset(?: today)?(?: in [^.]*)? is at\s+(\d{1,2}:\d{2})/i

    );

    if (!match) {
        return {
            type: "sunset",
            value: "",
            sourceUrl: result.url,
            retreivedAt: new Date().toISOString(),
            usableForMath: false,
            rejectionReason: "No explicit sunset time found",
        };
    }
    return {
        type: "sunset",
        value: match[1]!,
        sourceUrl: result.url,
        retreivedAt: new Date().toISOString(),
        usableForMath: true,
    };
}

export function weatherFactFromResult(
    result: ParallelResult,
    expectedDate: string
): WeatherEvidence {
    const text = result.excerpts?.join(" ") ?? "";
    const cleanText = text.replace(/<[^>]*>/g, "");

    const day = Number(expectedDate.split("-")[2]);
    const month = Number(expectedDate.split("-")[1]);

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

    const expectedDateText = `${day} ${monthNames[month]}`;

    const hasExpectedDate = cleanText
        .toLowerCase()
        .includes(expectedDateText.toLowerCase());

    // Evidence must explicitly match the shoot date.
    if (!hasExpectedDate) {
        return {
            condition: cleanText.slice(0, 200),
            sourceUrl: result.url,
            retreivedAt: new Date().toISOString(),
            usableForMath: false,
            rejectionReason:
                `Weather evidence does not explicitly match ${expectedDateText}`
        };
    }

    const precipitationMatch =
        cleanText.match(
            /(\d{1,3})%\s+(?:chance of\s+)?(?:rain|precipitation)/i
        ) ??
        cleanText.match(
            /(?:rain|precipitation)[^0-9]{0,30}(\d{1,3})%/i
        );

    // No numerical probability found.
    if (!precipitationMatch) {
        return {
            condition: cleanText.slice(0, 200),
            sourceUrl: result.url,
            retreivedAt: new Date().toISOString(),
            usableForMath: false,
            rejectionReason:
                "No explicit precipitation percentage found"
        };
    }

    const precipitationChance = Number(precipitationMatch[1]);

    if (
        !Number.isFinite(precipitationChance) ||
        precipitationChance < 0 ||
        precipitationChance > 100
    ) {
        return {
            condition: cleanText.slice(0, 200),
            sourceUrl: result.url,
            retreivedAt: new Date().toISOString(),
            usableForMath: false,
            rejectionReason:
                "Invalid precipitation percentage"
        };
    }

    // A probability can inform risk,
    // but it cannot be converted into delay minutes by itself.
    return {
        condition: "precipitation forecast",
        precipitationChance,
        sourceUrl: result.url,
        retreivedAt: new Date().toISOString(),
        usableForMath: false,
        warningOnly: true,
        rejectionReason:
            "Weather probability is evidence of risk, not an explicit delay duration"
    };
}
export function accessFactFromResult(
    result: ParallelResult
): AccessEvidence {
    const text = result.excerpts?.join(" ") ?? "";
    const cleanText = text.replace(/<[^>]*>/g, "");

    const closingTimeMatch =
        cleanText.match(
            /(?:closes at|closing time(?: is|:)?)[^0-9]{0,20}(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
        );

    if (!closingTimeMatch) {
        return {
            closingTime: "",
            sourceUrl: result.url,
            retreivedAt: new Date().toISOString(),
            usableForMath: false,
            rejectionReason: "No explicit closing time found"
        };
    }

    return {
        closingTime: closingTimeMatch[1]!,
        sourceUrl: result.url,
        retreivedAt: new Date().toISOString(),
        usableForMath: true
    };
}
