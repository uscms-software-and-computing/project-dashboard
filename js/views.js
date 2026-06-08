const LS_KEY = "pd.savedViews.v1";

/**
 * Captures the current table state in a serialisable shape.
 * Note: programmatic preset filters are functions and cannot be serialised,
 * so the active preset key is stored instead and re-applied on restore.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {Object} [presets] - The presets controller from initPresets().
 * @returns {Object} The captured state.
 */
function captureState(table, presets) {
    const sort = table.getSorters().map((s) => ({
        column: s.field || (s.column && s.column.getField ? s.column.getField() : s.column),
        dir: s.dir,
    })).filter((s) => s.column);

    const headerFilters = table.getHeaderFilters().map((f) => ({
        field: f.field,
        value: f.value,
    }));

    return {
        v: 1,
        sort,
        headerFilters,
        preset: (presets && presets.getActive) ? presets.getActive() : "all",
    };
}

/**
 * Applies a previously captured state to the table.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {Object} [presets] - The presets controller.
 * @param {Object} state - A state object from captureState().
 */
function applyState(table, presets, state) {
    if (!state) return;

    // Preset first: it clears header filters and sets the programmatic filter.
    if (presets && presets.applyPreset) presets.applyPreset(state.preset || "all");

    if (Array.isArray(state.sort) && state.sort.length) {
        try { table.setSort(state.sort); } catch (e) { console.warn("Sort restore failed", e); }
    }

    (state.headerFilters || []).forEach((f) => {
        try {
            table.setHeaderFilterValue(f.field, f.value);
            syncRangeInputs(table, f.field, f.value);
        } catch (e) { console.warn("Header filter restore failed", f, e); }
    });
}

/**
 * Pushes a restored {start, end} value into a custom range editor's input
 * boxes. Tabulator can't do this for custom editors, so the visible inputs
 * would otherwise keep their initial values even though the data re-filters.
 * Assumes the column header holds its two range inputs in start, end order
 * (true for both the date-range and min/max editors).
 *
 * @param {Object} table - The Tabulator instance.
 * @param {string} field - The column field.
 * @param {*} value - The restored header filter value.
 */
function syncRangeInputs(table, field, value) {
    if (!value || typeof value !== "object" || !("start" in value && "end" in value)) return;
    try {
        const colEl = table.getColumn(field).getElement();
        const inputs = colEl.querySelectorAll("input");
        if (inputs.length >= 2) {
            inputs[0].value = value.start == null ? "" : value.start;
            inputs[1].value = value.end == null ? "" : value.end;
        }
    } catch (e) {
        console.warn("Could not sync range inputs for", field, e);
    }
}

function loadAll() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
}

function saveAll(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
    catch (e) { console.warn("Could not persist views", e); }
}

// Unicode-safe base64 for the share link.
function encodeState(state) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
function decodeState(str) {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
    catch (e) { return null; }
}

/**
 * Builds the saved-views controls (dropdown + Save / Share / Delete) and
 * restores any view encoded in the URL hash once the table is built.
 *
 * @param {Object} table - The Tabulator instance.
 * @param {HTMLElement} mount - Container to append the controls to.
 * @param {Object} [presets] - The presets controller from initPresets().
 */
export function initViews(table, mount, presets) {
    const group = document.createElement("div");
    group.className = "dc-group";

    const label = document.createElement("span");
    label.className = "dc-label";
    label.textContent = "Views";
    group.appendChild(label);

    const select = document.createElement("select");
    select.className = "dc-select";
    group.appendChild(select);

    const saveBtn = mkBtn("Save");
    const shareBtn = mkBtn("Share link");
    const delBtn = mkBtn("Delete");
    group.append(saveBtn, shareBtn, delBtn);
    mount.appendChild(group);

    function mkBtn(text) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dc-btn";
        b.textContent = text;
        return b;
    }

    function refreshOptions(selected) {
        const all = loadAll();
        select.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = Object.keys(all).length ? "Select a view\u2026" : "No saved views";
        select.appendChild(placeholder);
        Object.keys(all).sort().forEach((name) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
        if (selected) select.value = selected;
    }

    select.addEventListener("change", () => {
        const name = select.value;
        if (!name) return;
        const all = loadAll();
        applyState(table, presets, all[name]);
    });

    saveBtn.addEventListener("click", () => {
        const name = (prompt("Name this view:") || "").trim();
        if (!name) return;
        const all = loadAll();
        all[name] = captureState(table, presets);
        saveAll(all);
        refreshOptions(name);
    });

    delBtn.addEventListener("click", () => {
        const name = select.value;
        if (!name) return;
        const all = loadAll();
        delete all[name];
        saveAll(all);
        refreshOptions("");
    });

    shareBtn.addEventListener("click", async () => {
        const link = `${location.origin}${location.pathname}#view=${encodeState(captureState(table, presets))}`;
        try {
            await navigator.clipboard.writeText(link);
            shareBtn.textContent = "Copied!";
            setTimeout(() => { shareBtn.textContent = "Share link"; }, 1500);
        } catch (e) {
            prompt("Copy this shareable link:", link);
        }
    });

    refreshOptions("");

    // Restore a view from the URL hash, e.g. #view=...
    table.on("tableBuilt", () => {
        const match = (location.hash || "").match(/view=([^&]+)/);
        if (match) applyState(table, presets, decodeState(match[1]));
    });
}
