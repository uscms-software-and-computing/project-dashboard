import {dateRangeFilter, dateRangeFilterEditor, minMaxFilterEditor, minMaxFilterFunction} from "./filter.js";
import {getLiveData} from "./api.js";
const DateTime = luxon.DateTime;

const DATE_FORMAT = "LL/dd/yyyy";
const ERROR_ELEMENT_ID = 'error-message';

export function displayErrorMessage(message) {
    const errorElement = document.getElementById(ERROR_ELEMENT_ID);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

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

function rowFormatter(row) {
    const data = row.getData();
    const today = DateTime.now();
    const upcomingDateCutOff = today.plus({ weeks: 6 });
    if (data.status === "Closed") {
        row.getElement().style.backgroundColor = "#9DC184";
    } else if (data.endDate < today) {
        row.getElement().style.backgroundColor = "#D26e69";
    } else if (data.endDate > today && data.endDate < upcomingDateCutOff) {
        row.getElement().style.backgroundColor = "#FADA76";
    }
}

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