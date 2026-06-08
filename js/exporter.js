import { downloadStyledXlsx } from "./xlsxStyled.js";

const DateTime = luxon.DateTime;

// Hidden columns worth including in exports (revealed during download, then re-hidden).
const REVEAL_FOR_EXPORT = ["startDate"];

const FORMATS = [
    { key: "csv", label: "CSV" },
    { key: "xlsx", label: "Excel" },
    { key: "pdf", label: "PDF" },
    { key: "json", label: "JSON" },
];

/**
 * Runs the actual download, temporarily revealing hidden-but-useful columns.
 * Columns flagged `download: false` are excluded automatically.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {string} fmt - One of "csv" | "xlsx" | "pdf" | "json".
 */
function doExport(table, fmt) {
    const stamp = DateTime.now().toFormat("yyyy-LL-dd");
    const base = `project-dashboard-${stamp}`;

    REVEAL_FOR_EXPORT.forEach((c) => {
        try { table.showColumn(c); } catch (e) { /* column may not exist */ }
    });

    try {
        switch (fmt) {
            case "csv":
                table.download("csv", `${base}.csv`, { delimiter: "," });
                break;
            case "json":
                table.download("json", `${base}.json`);
                break;
            case "xlsx":
                // Styled export via write-excel-file (handles its own download).
                downloadStyledXlsx(table, `${base}.xlsx`);
                break;
            case "pdf":
                if (!(window.jspdf || window.jsPDF)) {
                    alert("PDF export needs jsPDF + jspdf-autotable. See the wiring notes.");
                    break;
                }
                table.download("pdf", `${base}.pdf`, {
                    orientation: "landscape",
                    title: "USCMS S&C Project Dashboard",
                });
                break;
            default:
                break;
        }
    } finally {
        REVEAL_FOR_EXPORT.forEach((c) => {
            try { table.hideColumn(c); } catch (e) { /* no-op */ }
        });
    }
}

/**
 * Builds the export button group.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {HTMLElement} mount - Container to append the controls to.
 */
export function initExporter(table, mount) {
    const group = document.createElement("div");
    group.className = "dc-group";

    const label = document.createElement("span");
    label.className = "dc-label";
    label.textContent = "Export";
    group.appendChild(label);

    FORMATS.forEach((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dc-btn";
        b.textContent = f.label;
        b.addEventListener("click", () => doExport(table, f.key));
        group.appendChild(b);
    });

    mount.appendChild(group);
}
