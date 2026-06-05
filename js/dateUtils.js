const DateTime = luxon.DateTime;

/**
 * Coerces a value into a valid Luxon DateTime, or null.
 *
 * The processed row data may carry dates as Luxon DateTime objects, ISO
 * strings, JS Date objects, or epoch millis depending on where it is read,
 * so every new feature normalises through this single helper rather than
 * assuming a type.
 *
 * @param {*} value - A Luxon DateTime, JS Date, ISO string, epoch millis, or nullish.
 * @returns {DateTime|null} A valid DateTime, or null if the value cannot be parsed.
 */
export function toDateTime(value) {
    if (value === null || value === undefined || value === "") return null;
    if (value.isLuxonDateTime) return value.isValid ? value : null;
    if (value instanceof Date) return DateTime.fromJSDate(value);
    if (typeof value === "number") return DateTime.fromMillis(value);
    if (typeof value === "string") {
        const dt = DateTime.fromISO(value);
        return dt.isValid ? dt : null;
    }
    return null;
}
