const DateTime = luxon.DateTime;
const ENTER_KEY_CODE = 13;
const ESC_KEY_CODE = 27;


/**
 * Adds event listeners to an input element.
 * @param {HTMLInputElement} input - The input element.
 * @param {Function} buildValues - The function to call on change or blur events.
 * @param {Function} keypress - The function to call on keydown events.
 */
function addInputEventListeners(input, buildValues, keypress) {
    input.addEventListener("change", buildValues);
    input.addEventListener("blur", buildValues);
    input.addEventListener("keydown", keypress);
}

/**
 * Creates an input element with specified attributes and event listeners.
 * @param {string} type - The type of the input element.
 * @param {string} placeholder - The placeholder text for the input element.
 * @param {string} value - The initial value of the input element.
 * @param {Function} buildValues - The function to call on change or blur events.
 * @param {Function} keypress - The function to call on keydown events.
 * @returns {HTMLInputElement} The created input element.
 */
function createInputElement(type, placeholder, value, buildValues, keypress) {
    const input = document.createElement("input");
    input.setAttribute("type", type);
    input.setAttribute("placeholder", placeholder);
    input.style.padding = "4px";
    input.style.width = "50%";
    input.style.boxSizing = "border-box";
    input.value = value;

    addInputEventListeners(input, buildValues, keypress);

    return input;
}

/**
 * Creates a custom editor for min-max filtering.
 * @param {Object} cell - The cell component.
 * @param {Function} onRendered - Callback to trigger when the editor is rendered.
 * @param {Function} success - Callback to trigger on successful value change.
 * @param {Function} cancel - Callback to trigger on cancel.
 * @returns {HTMLElement} The container element with min and max input fields.
 */
export function minMaxFilterEditor(cell, onRendered, success, cancel) {
    let container = document.createElement("span");

    function buildValues() {
        success({
            start: start.value,
            end: end.value,
        });
    }

    function keypress(e) {
        if (e.keyCode === ENTER_KEY_CODE) {
            buildValues();
        }
        if (e.keyCode === ESC_KEY_CODE) {
            cancel();
        }
    }

    const start = createInputElement("number", "Min", cell.getValue(), buildValues, keypress);
    const end = createInputElement("number", "Max", "", buildValues, keypress);

    container.appendChild(start);
    container.appendChild(end);

    return container;
}

/**
 * Creates a custom editor for date range filtering.
 * @param {Object} cell - The cell component.
 * @param {Function} onRendered - Callback to trigger when the editor is rendered.
 * @param {Function} success - Callback to trigger on successful value change.
 * @param {Function} cancel - Callback to trigger on cancel.
 * @returns {HTMLElement} The container element with start and end date input fields.
 */
export function dateRangeFilterEditor(cell, onRendered, success, cancel) {
    let container = document.createElement("span");

    // Get the current date
    const today = new Date();

    // Create a new date object for the start of the year
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString().slice(0, 10);


    function buildValues() {
        success({
            start: start.value,
            end: end.value,
        });
    }

    function keypress(e) {
        if (e.keyCode === ENTER_KEY_CODE) {
            buildValues();
        }
        if (e.keyCode === ESC_KEY_CODE) {
            cancel();
        }
    }

    const start = createInputElement("date", "Start Date", startOfYear, buildValues, keypress);
    const end = createInputElement("date", "End Date", endOfYear, buildValues, keypress);

    container.appendChild(start);
    container.appendChild(end);

    return container;
}

/**
 * Custom filter function for min-max filtering.
 * @param {Object} headerValue - The value of the header filter element.
 * @param {number} rowValue - The value of the column in this row.
 * @returns {boolean} True if the row value passes the filter, false otherwise.
 */
export function minMaxFilterFunction(headerValue, rowValue) {
    if (rowValue) {
        if (headerValue.start !== "") {
            if (headerValue.end !== "") {
                return rowValue >= headerValue.start && rowValue <= headerValue.end;
            } else {
                return rowValue >= headerValue.start;
            }
        } else {
            if (headerValue.end !== "") {
                return rowValue <= headerValue.end;
            }
        }
    }

    return true; // Must return a boolean, true if it passes the filter.
}

/**
 * Custom filter function for date range filtering.
 * @param {Object} headerValue - The value of the header filter element.
 * @param {string} headerValue.start - The start date of the filter range in ISO format.
 * @param {string} headerValue.end - The end date of the filter range in ISO format.
 * @param {string} rowValue - The value of the column in this row in ISO format.
 * @param {Object} rowData - The data for the entire row.
 * @param {Array<Object>} [rowData.children] - The children of the row, if any.
 * @param {Object} [filterParams] - Additional parameters for the filter function.
 * @returns {boolean} True if the row value passes the filter, false otherwise.
 */
export function dateRangeFilter(headerValue, rowValue, rowData, filterParams) {
    try {
        const start = DateTime.fromISO(headerValue.start);
        const end = DateTime.fromISO(headerValue.end);
        const endDate = DateTime.fromISO(rowValue);

        const hasChildInRange = rowData.children?.some(child => {
            const childEndDate = DateTime.fromISO(child.endDate);
            return childEndDate >= start && childEndDate <= end;
        });

        return hasChildInRange || (endDate >= start && endDate <= end);
    } catch (error) {
        console.error("Invalid date format:", error);
        return false;
    }
}