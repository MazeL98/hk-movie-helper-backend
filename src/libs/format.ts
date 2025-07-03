import { FILM_SOURCE } from "../const/film_source";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
// 判断字符串是否符合‘YYYY-MM-DD’格式
export const isValidDateFormat = (str: string) => {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    return regex.test(str);
};

export function parseScheduleDate(input: string, source: FILM_SOURCE): string {
    let result: string;
    switch (source) {
        case FILM_SOURCE.BROADWAY:
            const [day, month] = input.split(" ")[0].split("/").map(Number);
            const year = new Date().getFullYear();
            const date = new Date(year, month - 1, day);
            result = date.toISOString().split("T")[0]; // format: 'YYYY-MM-DD'
            break;
        case FILM_SOURCE.EEG:
            console.log("日期解析前",input)
            const parts = input.trim().split("_");

            const cleaned = `${parts[0]}-${parts[1]}-${parts[3]}`; // "24_Jun_2025"
            // Step 2: Parse with custom format
            const parsed = dayjs(cleaned, "DD-MMM-YYYY");
            // Step 3: Format to 'YYYY-MM-DD'
            result = parsed.format("YYYY-MM-DD");
            console.log('日期解析后',result);
            break;
        default:
            result = dayjs(input).format("YYYY-MM-DD");
    }
    return result;
}

export function parseScheduleTime(input: string, source: FILM_SOURCE): string {
    let result: any;
    switch (source) {
        case FILM_SOURCE.BROADWAY:
            // Convert "05:00 PM" -> "17:00:00"
            const timeRegex = /\b\d{1,2}:\d{2} [AP]M\b/;

            const matchArr = input.match(timeRegex);
            let match = matchArr ? matchArr[0] : null;
            if (!match) return "";
            const [time, meridian] = match.trim().split(" ");
            let [hour, minute] = time.split(":").map(Number);

            if (meridian.toUpperCase() === "PM" && hour !== 12) hour += 12;
            if (meridian.toUpperCase() === "AM" && hour === 12) hour = 0;

            const hourStr = hour.toString().padStart(2, "0");
            const minuteStr = minute.toString().padStart(2, "0");
            result = `${hourStr}:${minuteStr}:00`; // format: 'HH:mm:ss'
            break;
        case FILM_SOURCE.EEG:
            const converted = input.replace("上午", "AM").replace("下午", "PM");
            // Step 2: Parse with dayjs using a custom format
            const parsed = dayjs(converted, "hh:mm A");
            // Step 3: Format to 24-hour tme
            result = parsed.format("HH:mm");
            break;
        default: 
        result = dayjs(input).format('HH:mm')
    }
    return result;
}

export const formatNameForIMDBQuery = (name: string) => {
    const match = name.match(/《(.*?)》/);

    if (match) {
        name = match[1];
    }

    const blacklist = [
        "<",
        ">",
        "-",
        "–",
        "*",
        "IMAX",
        "Dolby",
        "MX4D",
        "4DX",
        "4K",
        "Special Screening",
    ];
    const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedPattern = new RegExp(
        blacklist.map(escapeRegex).join("|"),
        "gi"
    );
    return name.replace(/\s*Critics Choice[\s\S]*$/, "")
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\([^\)]*\)/g, "")
        .replace(escapedPattern, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/ /g, "%20");
};

export const formatNameForDoubanQuery = (name: string) => {
    const match = name.match(/《(.*?)》/);
    if (match) {
        name = match[1];
    }
    const blacklist = [
        "<",
        ">",
        "-",
        "–",
        "*",
        "IMAX",
        "Dolby",
        "MX4D",
        "4DX",
        "4K",
        "Special Screening",
    ];
    const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedPattern = new RegExp(
        blacklist.map(escapeRegex).join("|"),
        "gi"
    );
    return name
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\([^\)]*\)/g, "")
        .replace(escapedPattern, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// 数据库入库前格式化电影名称数据
export const normalizeBroadwayFilmName = (name: string) => {
    let result = name.trim();
    // 若含有《》，直接截取内部文字
    const match = name.match(/《(.*?)》/);
    if (match) {
        result = match[1];
    }
    const blacklist = [
        "<",
        ">",
        "-",
        "–",
        "*",
        "IMAX",
        "Dolby",
        "MX4D",
        "4DX",
        "4K",
        "Special Screening",
    ];

    const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedPattern = new RegExp(
        blacklist.map(escapeRegex).join("|"),
        "gi"
    );

    return result
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\([^\)]*\)/g, "")
        .replace(escapedPattern, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// const mock=[
//   '《學姊是男孩劇場版：雨後天晴》菲林書籤特典場',
//   'Miley Cyrus: Something Beautiful (2025)',
//   'Dolby 28年後',
//   'MX4D 罪人們'
// ]
// const result= mock.map(item => normalizeBroadwayFilmName(item))
// console.log(JSON.stringify(result))

export const extractUrlFromCss = (rawString: string) => {

    if (!rawString) return "";
    const urlMatch = rawString.match(/url\(["']?(.*?)["']?\)/);

    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
    } else {
        return "";
    }
};
