import { initPresets } from "./presets.js";
import { initExporter } from "./exporter.js";
import { initViews } from "./views.js";

const CSS = `
.dc-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 10px 12px;
    margin: 0 0 10px;
    background: #f7f8fa;
    border: 1px solid #e2e5ea;
    border-radius: 6px;
    font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.dc-group { display: flex; align-items: center; gap: 6px; }
.dc-label {
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    font-size: 11px;
    margin-right: 2px;
}
.dc-btn {
    padding: 5px 10px;
    border: 1px solid #cfd4dc;
    border-radius: 5px;
    background: #fff;
    color: #1f2937;
    cursor: pointer;
    font-size: 13px;
}
.dc-btn:hover { background: #eef1f5; }
.dc-btn.is-active {
    background: #2f6fb0;
    border-color: #2f6fb0;
    color: #fff;
}
.dc-select {
    padding: 5px 8px;
    border: 1px solid #cfd4dc;
    border-radius: 5px;
    background: #fff;
    font-size: 13px;
    max-width: 180px;
}

/* Inline timeline column */
.tl-track {
    position: relative;
    height: 14px;
    background: #eef1f4;
    border-radius: 3px;
    overflow: hidden;
}
.tl-bar {
    position: absolute;
    top: 2px;
    height: 10px;
    border-radius: 3px;
    min-width: 2px;
}
.tl-today {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #c0392b;
    opacity: .5;
}
`;

function injectCSS() {
    if (document.getElementById("dc-styles")) return;
    const s = document.createElement("style");
    s.id = "dc-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
}

function ensureToolbar() {
    let bar = document.getElementById("dashboard-controls");
    if (!bar) {
        bar = document.createElement("div");
        bar.id = "dashboard-controls";
        bar.className = "dc-bar";
        const table = document.getElementById("example-table");
        if (table && table.parentNode) {
            table.parentNode.insertBefore(bar, table);
        } else {
            document.body.insertBefore(bar, document.body.firstChild);
        }
    }
    return bar;
}

/**
 * Mounts the dashboard control bar (quick filters, exports, saved views) and
 * injects the supporting CSS. Call once with the built Tabulator instance.
 *
 * @param {Object} table - The Tabulator instance.
 */
export function initControls(table) {
    injectCSS();
    const bar = ensureToolbar();
    const presets = initPresets(table, bar);
    initExporter(table, bar);
    initViews(table, bar, presets);
}
