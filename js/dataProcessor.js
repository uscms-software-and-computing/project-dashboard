
const DateTime = luxon.DateTime;

/**
 * Processes the data and maps it to a structured format.
 * @param {Object} data - The raw data to process.
 * @returns {Array<Object>} The processed data.
 */
export function processData(data) {
    const workPackages = data._embedded?.elements || [];

    const workActivities = jsonPath(data, "$._embedded.elements[?(@._links.type.title==\"Activity\")]");

    const workPackageById = workPackages.reduce((map, item) => {
        map[item.id] = item;
        return map;
    }, {});

    /**
     * Formats a date string to a DateTime object.
     * @param {string} date - The date string to format.
     * @returns {DateTime} The formatted DateTime object.
     */
    const formatDate = (date) => DateTime.fromISO(date);

    /**
     * Extracts the parent ID from a parent href.
     * @param {string} parentHref - The href string containing the parent ID.
     * @returns {number} The extracted parent ID.
     */
    const parentId = (parentHref) => Number((parentHref?.href?.match(/.*\/(\d+)/) || [])[1] || 0);

    /**
     * Maps a raw item to a structured format.
     * @param {Object} item - The raw item to map.
     * @param {number} item.id - The ID of the item.
     * @param {string} item.subject - The subject of the item.
     * @param {Object} item._links - The links associated with the item.
     * @param {string} item.date - The date of the item.
     * @param {string} item.startDate - The start date of the item.
     * @param {string} item.dueDate - The due date of the item.
     * @param {number} item.percentageDone - The percentage of completion of the item.
     * @returns {Object} The mapped item.
     */
    function itemMap(item) {
        const parentHref = item._links?.parent?.href;
        const childrenLinks = item._links.children;
        const startDate = item.startDate || item.date;
        const dueDate = item.dueDate || item.date;

        const parentIdValue = parentId(parentHref);
        const startDateFormatted = formatDate(startDate);
        const endDateFormatted = formatDate(dueDate);

        return {
            id: item.id,
            name: item.subject,
            project: item._links.project.title,
            parent: parentIdValue,
            children: childrenLinks ? getChildren(childrenLinks) : undefined,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            progress: item.percentageDone,
            status: item._links.status.title,
            type: item._links.type.title,
            rowColor: undefined
        };
    }

    /**
     * Retrieves and maps the children of a given list of children links.
     * @param {Array<Object>} childrenList - The list of children links.
     * @returns {Array<Object>} The mapped children.
     */
    function getChildren(childrenList) {
        return childrenList.map(child => {
            const childId = Number(child?.href?.match(/.*\/(\d+)/)?.[1]);
            return workPackageById[childId] || {};

        }).map(itemMap);
    }

    return workActivities
        .map(itemMap)
        .filter(item => item.children === undefined || item.children.every(child => child.type !== "Activity"));
}