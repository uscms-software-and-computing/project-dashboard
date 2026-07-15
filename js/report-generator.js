import { getLiveData } from "./api.js";
import { displayErrorMessage, clearErrorMessage } from "./ui.js";
import { initTable } from "./table.js";

// Main execution
getLiveData()
    .then(data => {
        if (data) {
            clearErrorMessage();
            initTable(data, {
                dataTreeStartExpanded: [true, false],
                extraColumnsOnDownload: ["startDate"],
            });
        }
    })
    .catch(error => {
        console.error("Error initializing the table:", error.message);
        displayErrorMessage("Failed to load data for the table. Please try again later.");
    });
