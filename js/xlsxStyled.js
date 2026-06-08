import { toDateTime } from "./dateUtils.js";

const DateTime = luxon.DateTime;

// write-excel-file is loaded as a global via <script src="js/write-excel-file.min.js">
// (vendored locally, like tabulator/luxon), exposing window.writeXlsxFile.

// Columns to export, in order. `kind` drives type/formatting.
const COLUMNS = [
    { key: "id",        header: "ID",          width: 10 },
    { key: "project",   header: "Area",        width: 26 },
    { key: "name",      header: "Description", width: 60 },
    { key: "startDate", header: "Start Date",  width: 14, kind: "date" },
    { key: "endDate",   header: "Finish Date", width: 14, kind: "date" },
    { key: "status",    header: "Status",      width: 16 },
    { key: "type",      header: "Type",        width: 12 },
    { key: "progress",  header: "Progress",    width: 12, kind: "percent" },
];

// Status colours, matching the on-screen row formatting.
const FILL = { closed: "#9DC184", overdue: "#D26E69", dueSoon: "#FADA76" };
const HEADER_BG = "#2F6FB0";
const BORDER = "#D9D9D9";

/**
 * Status-based fill for a row, computed with parsed dates (so the comparison
 * is correct regardless of how the raw value is stored).
 * @returns {string|null} A hex colour, or null for no fill.
 */
function statusFill(d) {
    const now = DateTime.now();
    const cutoff = now.plus({ weeks: 6 });
    const e = toDateTime(d.endDate);
    if (d.status === "Closed") return FILL.closed;
    if (e && e < now) return FILL.overdue;
    if (e && e > now && e < cutoff) return FILL.dueSoon;
    return null;
}

/** Flattens the (nested) tree into rows tagged with their depth. */
function flatten(rows, depth = 0, out = []) {
    (rows || []).forEach((d) => {
        out.push({ data: d, depth });
        if (Array.isArray(d.children) && d.children.length) flatten(d.children, depth + 1, out);
    });
    return out;
}

/** Builds a single styled cell for a column/row. */
function buildCell(col, data, depth) {
    const base = { borderStyle: "thin", borderColor: BORDER };
    const fill = statusFill(data);
    if (fill) base.backgroundColor = fill;

    const raw = data[col.key];

    if (col.kind === "date") {
        const dt = toDateTime(raw);
        return dt ? { ...base, value: dt.toJSDate(), type: Date, format: "mm/dd/yyyy" }
                  : { ...base, value: null };
    }

    if (col.kind === "percent") {
        if (raw === null || raw === undefined || raw === "") return { ...base, value: null };
        let n = Number(raw);
        if (Number.isNaN(n)) return { ...base, value: null };
        if (n > 1) n = n / 100; // Tabulator's progress formatter uses 0–100
        return { ...base, value: n, type: Number, format: "0%" };
    }

    const cell = { ...base, value: raw === null || raw === undefined ? null : String(raw) };
    if (col.key === "name" && depth > 0) cell.indent = depth; // reflect tree depth
    return cell;
}

/**
 * Generates and downloads a styled .xlsx of the currently active (filtered)
 * rows, including their tree children.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {string} filename - Output file name.
 */
export async function downloadStyledXlsx(table, filename) {
    const writeXlsxFile = window.writeXlsxFile;
    if (!writeXlsxFile) {
        alert('Excel export needs the write-excel-file library. Add <script src="js/write-excel-file.min.js"> before report-generator.js.');
        return;
    }

    const header = COLUMNS.map((c) => ({
        value: c.header,
        fontWeight: "bold",
        textColor: "#FFFFFF",
        backgroundColor: HEADER_BG,
        align: "left",
        borderStyle: "thin",
        borderColor: HEADER_BG,
    }));

    const rows = [header];
    flatten(table.getData("active")).forEach(({ data, depth }) => {
        rows.push(COLUMNS.map((c) => buildCell(c, data, depth)));
    });

    try {
        await writeXlsxFile(rows, {
            columns: COLUMNS.map((c) => ({ width: c.width })),
            sheet: "Dashboard",
            stickyRowsCount: 1,        // freeze the header row
            dateFormat: "mm/dd/yyyy",
            orientation: "landscape",
        }).toFile(filename);
    } catch (e) {
        console.error(e);
        alert("Excel export failed while writing the file. See the console for details.");
    }
}
