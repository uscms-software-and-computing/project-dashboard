import {dateRangeFilter, dateRangeFilterEditor, minMaxFilterEditor, minMaxFilterFunction} from "./filter.js";
import {getLiveData} from "./api.js";

const DateTime = luxon.DateTime;

const DATE_FORMAT = "LL/dd/yyyy";
const ERROR_ELEMENT_ID = 'error-message';

/**
 * Displays an error message.
 * @param {string} message - The error message to display.
 */
export function displayErrorMessage(message) {
    const errorElement = document.getElementById(ERROR_ELEMENT_ID);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Clears the error message.
 */
export function clearErrorMessage() {
    const errorElement = document.getElementById(ERROR_ELEMENT_ID);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function dateFormatter(cell, formatterParams, onRendered) {
    let value = cell.getValue();
    return DateTime.fromISO(value).toFormat(DATE_FORMAT);
}

// Get the current date
const today = new Date();

// Create a new date objects for the start and end of the year
// Set default values for the date range filter
const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString().slice(0, 10);

const tableColumns = [
    {title: ""},
    {title: "ID", field: "id", visible: true},
    // {title: "Name", field:"name", width:500},
    {title: "Area", field: "project", editor:"input", headerFilter:true},
    {title: "Description", field:"name", width:500},
    {title: "Start Date", field: "startDate", sorter: "date", editor:"input", width:150, visible: false,
        formatter: function(cell){
            let value = cell.getValue();
            value = DateTime.fromISO(value).toFormat(DATE_FORMAT);
            return value;
        },
        // accessorDownload: function(cell){
        //     let value = cell.getValue();
        //     value = DateTime.fromISO(value).toFormat(DATE_FORMAT);
        //     return value;
        // }
    },
    {title: "Finish Date", field: "endDate", sorter: "date", editor:"input", width:150,
        formatter: function(cell){
            let value = cell.getValue();
            value = DateTime.fromISO(value).toFormat(DATE_FORMAT);
            return value;
        },
        headerFilter: dateRangeFilterEditor,
        headerFilterFunc: dateRangeFilter,
        headerFilterPlaceholder: { start: startOfYear, end: endOfYear },
        // accessorDownload: function(cell){
        //     let value = cell.getValue();
        //     value = DateTime.fromISO(value).toFormat(DATE_FORMAT);
        //     return value;
        // }
    },
    {title: "Status", field: "status", editor: "input", headerFilter: true},
    {title: "Type", field: "type", editor: "input", headerFilter: true},
    {title: "Progress", field: "progress", editor:"input", visible:false, width:150, formatter:"progress", sorter:"number", headerFilter:minMaxFilterEditor, headerFilterFunc:minMaxFilterFunction, headerFilterLiveFilter:false},
    {title: "Row Color", field: "rowColor", visible:false},
];

/**
 * Formats the row based on the status and end date.
 * @param {Object} row - The row to format.
 */
function rowFormatter(row) {
    const data = row.getData();
    const today = DateTime.now();
    const upcomingDateCutOff = today.plus({ weeks: 6 });

    function checkChildStatus(data) {
        if (data.children !== undefined) {
            return data.children.every(child => child.status !== "Closed");
        }
        return true;
    }

    let backgroundColor = "";

    if (data.status === "Closed") {
        backgroundColor = "#9DC184";
    } else if (data.endDate < today && checkChildStatus(data)) {
        backgroundColor = "#D26e69";
    } else if (data.endDate > today && data.endDate < upcomingDateCutOff) {
        backgroundColor = "#FADA76";
    }

    // Perform DOM writes after all reads
    if (backgroundColor) {
        row.getElement().style.backgroundColor = backgroundColor;
        row.update({ rowColor: backgroundColor });
    }
}

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
        dataTreeStartExpanded: [true, false],
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
            table.showColumn("startDate");
            table.download("csv", "data-style.csv", { delimiter: "," });
            table.hideColumn("rowColor");
            table.hideColumn("startDate");
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