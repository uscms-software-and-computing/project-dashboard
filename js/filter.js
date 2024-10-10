const DateTime = luxon.DateTime;

export function minMaxFilterEditor(cell, onRendered, success, cancel){

    let end;

    let container = document.createElement("span");

    //create and style inputs
    const start = document.createElement("input");
    start.setAttribute("type", "number");
    start.setAttribute("placeholder", "Min");
    start.setAttribute("min", "0");
    start.setAttribute("max", "100");
    start.style.padding = "4px";
    start.style.width = "50%";
    start.style.boxSizing = "border-box";

    start.value = cell.getValue();

    function buildValues(){
        success({
            start:start.value,
            end:end.value,
        });
    }

    function keypress(e){
        if(e.keyCode === 13){
            buildValues();
        }

        if(e.keyCode === 27){
            cancel();
        }
    }

    end = start.cloneNode();
    end.setAttribute("placeholder", "Max");

    start.addEventListener("change", buildValues);
    start.addEventListener("blur", buildValues);
    start.addEventListener("keydown", keypress);

    end.addEventListener("change", buildValues);
    end.addEventListener("blur", buildValues);
    end.addEventListener("keydown", keypress);


    container.appendChild(start);
    container.appendChild(end);

    // console.log(container);
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


export function dateRangeFilterEditor (cell, onRendered, success, cancel){

    let end;

    let container = document.createElement("span");

    //create and style inputs
    const start = document.createElement("input");
    start.setAttribute("id", "start-date");
    start.setAttribute("type", "date");
    start.setAttribute("placeholder", "Start Date");
    start.style.padding = "4px";
    start.style.width = "50%";
    start.style.boxSizing = "border-box";

    start.value = cell.getValue();

    function buildValues(){
        success({
            start: start.value,
            end: end.value
        });
    }

    function keypress(e){
        if(e.keyCode === 13){
            buildValues();
        }

        if(e.keyCode === 27){
            cancel();
        }
    }

    end = start.cloneNode();
    end.setAttribute("placeholder", "End Date");
    end.setAttribute("id", "end-date");


    start.addEventListener("change", buildValues);
    start.addEventListener("blur", buildValues);
    start.addEventListener("keydown", keypress);

    end.addEventListener("change", buildValues);
    end.addEventListener("blur", buildValues);
    end.addEventListener("keydown", keypress);

    container.appendChild(start);
    container.appendChild(end);

    // console.log(container);
    return container;
}