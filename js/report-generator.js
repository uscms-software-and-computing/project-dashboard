import {getLiveData} from "./api.js";
import {dateRangeFilter} from "./filter.js";
import {displayErrorMessage, clearErrorMessage, rowFormatter, tableColumns } from "./ui.js";
import {timelineColumn, setTimelineWindow} from "./timeline.js";   // NEW
import {initControls} from "./dashboardControls.js";               // NEW

/**
 * Initializes the table with the given data.
 * @param {Array} data - The data to populate the table.
 */
function initTable(data) {
    setTimelineWindow(data); // NEW: compute the timeline window before first render

    Tabulator.extendModule("filter", "filters", {
        "dateRange": dateRangeFilter,
    });
    Tabulator.extendModule("download", "downloaders", {
        htmlStyle: function(list, options, setFileContents) {
            setFileContents(this.modules.export.getHtml("active", true), "text/html");
        }
    })
    const table = new Tabulator("#example-table", {
        data: data,
        dataTree: true,
        dataTreeStartExpanded: [true, false],
        dataTreeChildField: "children",
        dataTreeSort: false,
        columns: [...tableColumns, timelineColumn], // NEW: append the timeline column
        groupBy: ["project"],
        initialSort: [
            { column: "endDate", dir: "asc" },
            { column: "project", dir: "asc" },
        ],
        initialFilter: [
            { field: "status", type: "!=", value: "Retired" },
        ],
        rowFormatter: rowFormatter,
    });

    initControls(table); // NEW: quick filters, exports, and saved views

    table.on("tableBuilt", () => {
        // Default the date-range filter to the start/end of the current year.
        const DateTime = luxon.DateTime;
        table.setHeaderFilterValue("endDate", {
            start: DateTime.now().startOf("year").toISODate(),
            end:   DateTime.now().endOf("year").toISODate(),
        });
    });

    // The dedicated #download-html button is now optional — the Export group in
    // the control bar covers CSV/Excel/PDF/JSON. Kept here for backwards compat.
    table.on("tableBuilt", () => {
        const btn = document.getElementById("download-html");
        if (!btn) return;
        btn.addEventListener("click", function () {
            table.showColumn("startDate");
            table.download("csv", "data-style.csv", { delimiter: "," });
            table.hideColumn("startDate");
        });
    });
}

// Main execution
getLiveData()
    .then(data => {
        if (data) {
            clearErrorMessage();
            initTable(data);
        }
    })
    .catch(error => {
        console.error("Error initializing the table:", error.message);
        displayErrorMessage("Failed to load data for the table. Please try again later.");
    });
