
const DateTime = luxon.DateTime;
export function processData(data) {
    const workPackages = data._embedded?.elements || [];

    const workActivities = jsonPath(data, "$._embedded.elements[?(@._links.type.title==\"Activity\")]");

    const workPackageById = workPackages.reduce((map, item) => {
        map[item.id] = item;
        return map;
    }, {});

    const formatDate = (date) => DateTime.fromISO(date);
    const parentId = (parentHref) => Number((parentHref?.href?.match(/.*\/(\d+)/) || [])[1] || 0);

    /**
     * @param item
     * @param item.id
     * @param item.subject
     * @param item._links
     * @param item.date
     * @param item.startDate
     * @param item.dueDate
     * @param item.percentageDone
     */
    function itemMap(item) {
        return {
            id: item.id,
            name: item.subject,
            project: item._links.project.title,
            parent: parentId(item._links?.parent?.href),
            children: item._links.children ? getChildren(item._links.children) : undefined,
            startDate: formatDate(item.startDate || item.date),
            endDate: formatDate(item.dueDate || item.date),
            progress: item.percentageDone,
            status: item._links.status.title,
        }
    }

    function getChildren(childrenList) {
        return childrenList.map(child => {
            const childId = Number(child?.href?.match(/.*\/(\d+)/)?.[1]);
            return workPackageById[childId] || {};

        }).map(itemMap);
    }


    return workActivities.map(itemMap);
}