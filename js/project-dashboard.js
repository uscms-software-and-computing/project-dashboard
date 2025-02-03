import {getLiveData} from "./api.js";
import {dateRangeFilter} from "./filter.js";
import {displayErrorMessage, clearErrorMessage, rowFormatter, tableColumns } from "./ui.js";

/**
 * Initializes the table with the given data.
 * @param {Array} data - The data to populate the table.
 */
function initTable(data) {
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
        // dataTreeStartExpanded: [true, false],
        dataTreeChildField: "children",
        dataTreeSort: false,
        columns: tableColumns,
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

    table.on("tableBuilt", () => {
        table.setHeaderFilterValue("endDate", { start: "2024-01-01", end: "2024-12-31" });
    });

    table.on("tableBuilt", () => {
        document.getElementById("download-html").addEventListener("click", function () {
            table.showColumn("rowColor");
            table.download("csv", "data-style.csv", { delimiter: "," });
            table.hideColumn("rowColor");
            // const data = table.getHtml("active", true);
            // console.log(data);
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