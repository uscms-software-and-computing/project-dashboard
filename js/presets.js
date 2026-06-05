import { toDateTime } from "./dateUtils.js";

const DateTime = luxon.DateTime;

/**
 * Returns true if the row, or any descendant, satisfies the predicate.
 * Mirrors the child-aware behaviour of the existing date-range filter.
 *
 * @param {Object} d - The row data.
 * @param {Function} pred - Predicate run against a row's data.
 * @returns {boolean}
 */
function anyMatch(d, pred) {
    if (pred(d)) return true;
    return Array.isArray(d.children) && d.children.some((c) => anyMatch(c, pred));
}

const predicates = {
    overdue: (d) => {
        const e = toDateTime(d.endDate);
        return !!e && e < DateTime.now() && d.status !== "Closed";
    },
    dueSoon: (d) => {
        const e = toDateTime(d.endDate);
        const now = DateTime.now();
        return !!e && e >= now && e <= now.plus({ weeks: 6 }) && d.status !== "Closed";
    },
    closed: (d) => d.status === "Closed",
};

const PRESETS = [
    { key: "all", label: "All" },
    { key: "overdue", label: "Overdue" },
    { key: "dueSoon", label: "Due \u2264 6 wks" },
    { key: "closed", label: "Closed" },
];

/**
 * Builds the quick-filter button group and wires it to the table.
 *
 * Presets own the date dimension: applying one clears header filters and
 * replaces the programmatic filter (keeping the "not Retired" exclusion).
 *
 * @param {Object} table - The Tabulator instance.
 * @param {HTMLElement} mount - Container to append the controls to.
 * @returns {{applyPreset: Function, getActive: Function}} Controller used by views.js.
 */
export function initPresets(table, mount) {
    const group = document.createElement("div");
    group.className = "dc-group";

    const label = document.createElement("span");
    label.className = "dc-label";
    label.textContent = "Quick filter";
    group.appendChild(label);

    const btns = {};
    let active = "all";

    PRESETS.forEach((p) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dc-btn";
        b.textContent = p.label;
        b.addEventListener("click", () => applyPreset(p.key));
        group.appendChild(b);
        btns[p.key] = b;
    });

    mount.appendChild(group);

    function setActive(key) {
        active = key;
        Object.entries(btns).forEach(([k, b]) => b.classList.toggle("is-active", k === key));
    }

    function applyPreset(key) {
        table.clearHeaderFilter();
        if (key === "all") {
            table.setFilter("status", "!=", "Retired");
        } else {
            const pred = predicates[key];
            table.setFilter((d) => d.status !== "Retired" && anyMatch(d, pred));
        }
        setActive(key);
    }

    setActive("all"); // reflects the table's initialFilter on load
    return { applyPreset, getActive: () => active };
}
