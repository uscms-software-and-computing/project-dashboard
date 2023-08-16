"use strict";

async function getWorkPackages() {
    const response = await fetch("https://uscms-software-and-computing.github.io/OpenProject_data/data/all_results.json");
    const workPackages = await response.json();

    let nameAndDate: any;
    nameAndDate = workPackages["_embedded"].elements.map((x: { subject: any; percentageDone: any; }) => ({
        subject: x.subject,
        progress: x.percentageDone
    }));
    // console.log(nameAndDate);
    return(nameAndDate);
}

const [data] = await Promise.all([getWorkPackages()]);
let list = document.getElementById("workPackageList")!;
data.forEach(function (item: any) {
    console.log(item);
    let listIndex = document.createElement("li");
    listIndex.innerText = item.subject + " " + item.progress;
    list.appendChild(listIndex);
});


export { };


