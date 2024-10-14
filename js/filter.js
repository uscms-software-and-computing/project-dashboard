const DateTime = luxon.DateTime;

function createInputElement(type, placeholder, value, buildValues, keypress) {
    const input = document.createElement("input");
    input.setAttribute("type", type);
    input.setAttribute("placeholder", placeholder);
    input.style.padding = "4px";
    input.style.width = "50%";
    input.style.boxSizing = "border-box";
    input.value = value;

    input.addEventListener("change", buildValues);
    input.addEventListener("blur", buildValues);
    input.addEventListener("keydown", keypress);

    return input;
}

export function minMaxFilterEditor(cell, onRendered, success, cancel) {
    let container = document.createElement("span");

    function buildValues() {
        success({
            start: start.value,
            end: end.value,
        });
    }

    function keypress(e) {
        if (e.keyCode === 13) {
            buildValues();
        }
        if (e.keyCode === 27) {
            cancel();
        }
    }

    const start = createInputElement("number", "Min", cell.getValue(), buildValues, keypress);
    const end = createInputElement("number", "Max", "", buildValues, keypress);

    container.appendChild(start);
    container.appendChild(end);

    return container;
}

export function dateRangeFilterEditor(cell, onRendered, success, cancel) {
    let container = document.createElement("span");

    function buildValues() {
        success({
            start: start.value,
            end: end.value,
        });
    }

    function keypress(e) {
        if (e.keyCode === 13) {
            buildValues();
        }
        if (e.keyCode === 27) {
            cancel();
        }
    }

    const start = createInputElement("date", "Start Date", cell.getValue(), buildValues, keypress);
    const end = createInputElement("date", "End Date", "", buildValues, keypress);

    container.appendChild(start);
    container.appendChild(end);

    return container;
}

//custom max min filter function
export function minMaxFilterFunction(headerValue, rowValue){
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row

    if(rowValue){
        if(headerValue.start !== ""){
            if(headerValue.end !== ""){
                return rowValue >= headerValue.start && rowValue <= headerValue.end;
            }else{
                return rowValue >= headerValue.start;
            }
        }else{
            if(headerValue.end !== ""){
                return rowValue <= headerValue.end;
            }
        }
    }

    return true; //must return a boolean, true if it passes the filter.
}


export function dateRangeFilter(headerValue, rowValue) {
    const start = DateTime.fromISO(headerValue.start);
    const end = DateTime.fromISO(headerValue.end);

    const endDate = DateTime.fromISO(rowValue);
    return endDate >= start && endDate <= end;
}