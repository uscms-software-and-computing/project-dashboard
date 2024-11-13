import {scJsonUrl, wbs1JsonUrl, wbs2JsonUrl, wbs3JsonUrl, wbs4JsonUrl} from './config.js';
import {processData} from "./dataProcessor.js";
import {displayErrorMessage} from "./ui.js";

/**
 * Fetches live data from multiple JSON URLs and processes it.
 * @async
 * @function getLiveData
 * @returns {Promise<Array<Object>|null>} The combined processed data or null if an error occurs.
 */
export async function getLiveData() {
    try {
        const urls = [scJsonUrl, wbs1JsonUrl, wbs2JsonUrl, wbs3JsonUrl, wbs4JsonUrl];
        const fetchPromises = urls.map(url => fetch(url, { mode: 'cors' }));

        const responses = await Promise.all(fetchPromises);

        const jsonDataPromises = responses.map(response => {
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return null;
            }
            return response.json();
        });

        const jsonDataArray = await Promise.all(jsonDataPromises);

        // Validate the expected structure and process data
        const processedDataArray = jsonDataArray.map(jsonData => {
            if (!jsonData?._embedded?.elements) {
                console.error("Unexpected data structure");
                return [];
            }
            return processData(jsonData);
        });

        // Combine all processed data into a single array
        return processedDataArray.flat();
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        displayErrorMessage("Failed to load data. Please try again later.");
        return null; // Ensure a null return on error
    }
}