import { dateRangeFilter } from "./filter.js";
import { rowFormatter, tableColumns } from "./ui.js";

const DateTime = luxon.DateTime;

/**
 * Initializes the Tabulator table with the given data and options.
 * @param {Array} data - The data to populate the table.
 * @param {Object} [options={}] - Optional overrides for table behaviour.
 * @param {boolean|Array} [options.dataTreeStartExpanded] - Whether tree rows start expanded.
 * @param {string[]} [options.extraColumnsOnDownload=[]] - Column fields to temporarily show during CSV download.
 */
export function initTable(data, options = {}) {
    const { dataTreeStartExpanded, extraColumnsOnDownload = [] } = options;

    Tabulator.extendModule("filter", "filters", {
        dateRange: dateRangeFilter,
    });

    Tabulator.extendModule("download", "downloaders", {
        htmlStyle: function (list, opts, setFileContents) {
            setFileContents(this.modules.export.getHtml("active", true), "text/html");
        },
    });

    const tableConfig = {
        data,
        dataTree: true,
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
        rowFormatter,
    };

    if (dataTreeStartExpanded !== undefined) {
        tableConfig.dataTreeStartExpanded = dataTreeStartExpanded;
    }

    const table = new Tabulator("#example-table", tableConfig);

    table.on("tableBuilt", () => {
        // Default the date-range filter to the start/end of the current year.
        table.setHeaderFilterValue("endDate", {
            start: DateTime.now().startOf("year").toISODate(),
            end: DateTime.now().endOf("year").toISODate(),
        });

        document.getElementById("download-html").addEventListener("click", function () {
            table.showColumn("rowColor");
            extraColumnsOnDownload.forEach(col => table.showColumn(col));

            table.download("csv", "data-style.csv", { delimiter: "," });

            table.hideColumn("rowColor");
            extraColumnsOnDownload.forEach(col => table.hideColumn(col));
        });
    });
}
