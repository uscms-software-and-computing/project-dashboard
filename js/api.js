import { jsonUrl } from './config.js';
import {processData} from "./dataProcessor.js";
import {displayErrorMessage} from "./ui.js";

export async function getLiveData() {
    try {
        const response = await fetch(jsonUrl, { mode: 'cors' });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        const jsonData = await response.json();

        // Validate the expected structure
        /**
        * @param {{_embedded:json}} data
        */
        if (!jsonData?._embedded?.elements) {
            console.error("Unexpected data structure");
            return;
        }

        return processData(jsonData);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        displayErrorMessage("Failed to load data. Please try again later.");
        return null; // Ensure a null return on error
    }
}