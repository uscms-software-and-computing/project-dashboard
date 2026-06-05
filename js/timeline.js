import { toDateTime } from "./dateUtils.js";

const DateTime = luxon.DateTime;

// The visible date window the bars are drawn against. Set from the data via
// setTimelineWindow() before the table is built.
let windowStart = null;
let windowEnd = null;

/**
 * Computes the timeline window (left/right edges) from the dataset.
 * Walks the tree so nested children are included in the min/max.
 *
 * @param {Array<Object>} data - The processed row data.
 * @param {Object} [opts] - Optional overrides.
 * @param {string|DateTime|Date} [opts.start] - Force the window start.
 * @param {string|DateTime|Date} [opts.end] - Force the window end.
 */
export function setTimelineWindow(data, opts = {}) {
    let min = null;
    let max = null;

    const visit = (rows) => {
        rows.forEach((d) => {
            const s = toDateTime(d.startDate);
            const e = toDateTime(d.endDate);
            if (s && (!min || s < min)) min = s;
            if (e && (!max || e > max)) max = e;
            if (Array.isArray(d.children)) visit(d.children);
        });
    };

    if (Array.isArray(data)) visit(data);

    if (min && max) {
        windowStart = opts.start ? toDateTime(opts.start) : min.startOf("month");
        windowEnd = opts.end ? toDateTime(opts.end) : max.endOf("month");
    }
}

/**
 * Picks a bar colour that mirrors the row-colouring rules used elsewhere:
 * closed = green, overdue = red, due within 6 weeks = amber, otherwise blue.
 *
 * @param {Object} d - The row data.
 * @returns {string} A CSS colour.
 */
function barColor(d) {
    const now = DateTime.now();
    const cutoff = now.plus({ weeks: 6 });
    const e = toDateTime(d.endDate);

    if (d.status === "Closed") return "#9DC184";
    if (e && e < now) return "#D26E69";
    if (e && e > now && e < cutoff) return "#FADA76";
    return "#7FA8D4";
}

/**
 * Cell formatter that draws a horizontal bar positioned by start/end date
 * within the shared timeline window. Reads from row data, so it inherits the
 * table's filtering, grouping, and tree behaviour for free.
 *
 * @param {Object} cell - The Tabulator cell component.
 * @returns {HTMLElement|string} The rendered track, or "" when nothing to draw.
 */
function timelineFormatter(cell) {
    if (!windowStart || !windowEnd) return "";

    const d = cell.getData();
    const s = toDateTime(d.startDate);
    const e = toDateTime(d.endDate);
    if (!s && !e) return "";

    const barStart = s || e;
    const barEnd = e || s;

    const total = windowEnd.toMillis() - windowStart.toMillis();
    if (total <= 0) return "";

    const clamp = (v) => Math.max(0, Math.min(1, v));
    const left = clamp((barStart.toMillis() - windowStart.toMillis()) / total) * 100;
    const right = clamp((barEnd.toMillis() - windowStart.toMillis()) / total) * 100;
    const width = Math.max(right - left, 0.8); // keep milestones visible
    const todayPct = clamp((DateTime.now().toMillis() - windowStart.toMillis()) / total) * 100;

    const track = document.createElement("div");
    track.className = "tl-track";

    const today = document.createElement("div");
    today.className = "tl-today";
    today.style.left = `${todayPct}%`;

    const bar = document.createElement("div");
    bar.className = "tl-bar";
    bar.style.left = `${left}%`;
    bar.style.width = `${width}%`;
    bar.style.background = barColor(d);

    track.appendChild(today);
    track.appendChild(bar);
    track.title = `${barStart.toFormat("LLL d, yyyy")} \u2192 ${barEnd.toFormat("LLL d, yyyy")}`;

    return track;
}

/**
 * Column definition for the inline timeline. Spread into the table's columns,
 * e.g. `columns: [...tableColumns, timelineColumn]`.
 */
export const timelineColumn = {
    title: "Timeline",
    field: "timeline",
    headerSort: false,
    download: false, // never appears in exports
    minWidth: 220,
    widthGrow: 3,
    formatter: timelineFormatter,
};
