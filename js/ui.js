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

const tableColumns = [
    {title: "Name", field:"name", width:500},
    {title: "Project", field: "project", editor:"input", headerFilter:true},
    {title: "End Date", field: "endDate", sorter: "date", editor:"input", width:150,
        formatter: function(cell){
            let value = cell.getValue();
            value = DateTime.fromISO(value).toFormat(DATE_FORMAT);
            return value;
        },
        headerFilter: dateRangeFilterEditor,
        headerFilterFunc: dateRangeFilter,
    },
    {title: "Status", field: "status", editor: "input", headerFilter: true},
    {title: "Progress", field: "progress", editor:"input", visible:false, width:150, formatter:"progress", sorter:"number", headerFilter:minMaxFilterEditor, headerFilterFunc:minMaxFilterFunction, headerFilterLiveFilter:false}
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
            const childStatus = data.children.every(child => child.status !== "Closed");
            return childStatus;
        }
        return true;
    }

    if (data.status === "Closed") {
        row.getElement().style.backgroundColor = "#9DC184";
    } else if (data.endDate < today && checkChildStatus(data)) {
        row.getElement().style.backgroundColor = "#D26e69";
    } else if (data.endDate > today && data.endDate < upcomingDateCutOff) {
        row.getElement().style.backgroundColor = "#FADA76";
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

    const table = new Tabulator("#example-table", {
        data: data,
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
        rowFormatter: rowFormatter,
    });

    table.on("tableBuilt", () => {
        table.setHeaderFilterValue("endDate", { start: "2024-01-01", end: "2024-12-31" });
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