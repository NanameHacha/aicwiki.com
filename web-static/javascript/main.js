/*
 * html-excel-loader
 *
 * Automatically loads elements with a data-excel-src attribute.
 * - Keeps rendering cell strings as HTML for existing workbooks.
 * - Renders directly from worksheet coordinates, avoiding lossy CSV parsing.
 */

const EXCEL_SELECTOR = "[data-excel-src]";
const excelElementLoads = new WeakMap();

function getXLSX() {
    const root = typeof globalThis !== "undefined" ? globalThis : window;
    const library = root.XLSX;

    if (!library || typeof library.read !== "function" || !library.utils) {
        throw new Error("XLSX 未加载，请先加载 core.js");
    }

    return library;
}

function readWorkbookFromRemoteFile(url, signal) {
    return (async () => {
        const response = await fetch(url, {
            method: "GET",
            credentials: "same-origin",
            signal
        });

        if (!response.ok) {
            throw new Error(`Excel 下载失败：HTTP ${response.status}`);
        }

        const data = await response.arrayBuffer();
        return getXLSX().read(data, { type: "array" });
    })();
}

function getCell(worksheet, row, column, xlsx) {
    if (worksheet["!data"]) {
        return worksheet["!data"][row]
            ? worksheet["!data"][row][column]
            : undefined;
    }

    if (Array.isArray(worksheet)) {
        return worksheet[row] ? worksheet[row][column] : undefined;
    }

    return worksheet[xlsx.utils.encode_cell({
        r: row,
        c: column
    })];
}

function getDisplayValue(cell, xlsx) {
    if (!cell || cell.v == null) {
        return "";
    }

    if (cell.w != null) {
        return String(cell.w);
    }

    return String(xlsx.utils.format_cell(cell));
}

function normalizeMerge(merge) {
    if (!merge || !merge.s || !merge.e) {
        return null;
    }

    const startRow = Math.min(merge.s.r, merge.e.r);
    const endRow = Math.max(merge.s.r, merge.e.r);
    const startColumn = Math.min(merge.s.c, merge.e.c);
    const endColumn = Math.max(merge.s.c, merge.e.c);

    if (
        ![
            startRow,
            endRow,
            startColumn,
            endColumn
        ].every(Number.isInteger)
    ) {
        return null;
    }

    return {
        s: {
            r: startRow,
            c: startColumn
        },
        e: {
            r: endRow,
            c: endColumn
        }
    };
}

function getRenderRange(worksheet, xlsx, merges) {
    let range = worksheet["!ref"]
        ? xlsx.utils.decode_range(worksheet["!ref"])
        : null;

    merges.forEach((merge) => {
        if (!range) {
            range = {
                s: {
                    r: merge.s.r,
                    c: merge.s.c
                },
                e: {
                    r: merge.e.r,
                    c: merge.e.c
                }
            };

            return;
        }

        range.s.r = Math.min(range.s.r, merge.s.r);
        range.s.c = Math.min(range.s.c, merge.s.c);
        range.e.r = Math.max(range.e.r, merge.e.r);
        range.e.c = Math.max(range.e.c, merge.e.c);
    });

    return range;
}

function buildMergeIndex(merges) {
    const owners = new Map();
    const covered = new Set();

    merges.forEach((merge) => {
        const ownerKey = `${merge.s.r}:${merge.s.c}`;

        if (
            owners.has(ownerKey) ||
            covered.has(ownerKey)
        ) {
            return;
        }

        owners.set(ownerKey, {
            rowSpan: merge.e.r - merge.s.r + 1,
            colSpan: merge.e.c - merge.s.c + 1
        });

        for (
            let row = merge.s.r;
            row <= merge.e.r;
            row += 1
        ) {
            for (
                let column = merge.s.c;
                column <= merge.e.c;
                column += 1
            ) {
                if (
                    row !== merge.s.r ||
                    column !== merge.s.c
                ) {
                    covered.add(`${row}:${column}`);
                }
            }
        }
    });

    return {
        owners,
        covered
    };
}

function renderWorksheet(worksheet) {
    const xlsx = getXLSX();

    const merges = (worksheet["!merges"] || [])
        .map(normalizeMerge)
        .filter(Boolean);

    const range = getRenderRange(
        worksheet,
        xlsx,
        merges
    );

    const mergeIndex = buildMergeIndex(merges);
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    table.appendChild(tbody);

    if (!range) {
        return table;
    }

    const rows = document.createDocumentFragment();

    for (
        let row = range.s.r;
        row <= range.e.r;
        row += 1
    ) {
        const tr = document.createElement("tr");

        for (
            let column = range.s.c;
            column <= range.e.c;
            column += 1
        ) {
            const key = `${row}:${column}`;

            if (mergeIndex.covered.has(key)) {
                continue;
            }

            const td = document.createElement("td");
            const span = mergeIndex.owners.get(key);

            if (span) {
                td.rowSpan = span.rowSpan;
                td.colSpan = span.colSpan;
                td.setAttribute("align", "center");
            }

            /*
             * 保留旧版行为：
             * Excel 单元格中的 HTML 继续作为 HTML 渲染。
             */
            td.innerHTML = getDisplayValue(
                getCell(
                    worksheet,
                    row,
                    column,
                    xlsx
                ),
                xlsx
            );

            tr.appendChild(td);
        }

        rows.appendChild(tr);
    }

    tbody.appendChild(rows);

    return table;
}

function renderWorkbook(workbook, container) {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!sheetName || !worksheet) {
        throw new Error("Excel 中没有可读取的工作表");
    }

    const table = renderWorksheet(worksheet);

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    container.appendChild(table);

    container.dispatchEvent(
        new CustomEvent("excel-loader:loaded", {
            detail: {
                workbook,
                worksheet,
                sheetName,
                table
            }
        })
    );

    return table;
}

function reportLoadError(error, url, container) {
    console.error(
        `[html-excel-loader] 加载失败：${url}`,
        error
    );

    if (container) {
        container.dispatchEvent(
            new CustomEvent("excel-loader:error", {
                detail: {
                    error,
                    url
                }
            })
        );
    }
}

function abortExcelElementLoad(element) {
    const current = excelElementLoads.get(element);

    if (current) {
        current.controller.abort();
        excelElementLoads.delete(element);
    }
}

function clearExcelElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    element.removeAttribute("aria-busy");
    element.removeAttribute("data-excel-state");
}

function loadExcelElement(element, force) {
    if (
        !element ||
        (
            !element.matches(EXCEL_SELECTOR) &&
            !excelElementLoads.has(element)
        )
    ) {
        return Promise.resolve(null);
    }

    const src = (
        element.getAttribute("data-excel-src") || ""
    ).trim();

    const current = excelElementLoads.get(element);

    if (
        !force &&
        current &&
        current.src === src
    ) {
        return current.promise;
    }

    abortExcelElementLoad(element);

    if (!src) {
        if (current) {
            clearExcelElement(element);
        }

        return Promise.resolve(null);
    }

    const controller = new AbortController();

    const state = {
        src,
        controller,
        promise: null
    };

    element.classList.add("table-container");
    element.setAttribute("aria-busy", "true");
    element.setAttribute(
        "data-excel-state",
        "loading"
    );

    state.promise = readWorkbookFromRemoteFile(
        src,
        controller.signal
    )
        .then((workbook) => {
            if (
                excelElementLoads.get(element) !== state
            ) {
                return null;
            }

            element.setAttribute(
                "data-excel-state",
                "loaded"
            );

            return renderWorkbook(
                workbook,
                element
            );
        })
        .catch((error) => {
            if (
                error &&
                error.name === "AbortError"
            ) {
                return null;
            }

            if (
                excelElementLoads.get(element) === state
            ) {
                element.setAttribute(
                    "data-excel-state",
                    "error"
                );

                reportLoadError(
                    error,
                    src,
                    element
                );
            }

            return null;
        })
        .finally(() => {
            if (
                excelElementLoads.get(element) === state
            ) {
                element.removeAttribute("aria-busy");
            }
        });

    excelElementLoads.set(element, state);

    return state.promise;
}

function visitExcelElements(root, callback) {
    if (!root || root.nodeType !== 1) {
        return;
    }

    if (root.matches(EXCEL_SELECTOR)) {
        callback(root);
    }

    root
        .querySelectorAll(EXCEL_SELECTOR)
        .forEach(callback);
}

function scanExcelElements(root) {
    const scope = root || document;

    scope
        .querySelectorAll(EXCEL_SELECTOR)
        .forEach(loadExcelElement);
}

function startExcelAutoLoader() {
    scanExcelElements(document);

    const observer = new MutationObserver(
        (mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes") {
                    loadExcelElement(
                        mutation.target,
                        true
                    );

                    return;
                }

                mutation.addedNodes.forEach((node) => {
                    visitExcelElements(
                        node,
                        loadExcelElement
                    );
                });

                mutation.removedNodes.forEach((node) => {
                    visitExcelElements(
                        node,
                        abortExcelElementLoad
                    );
                });
            });
        }
    );

    observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
            "data-excel-src"
        ]
    });
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startExcelAutoLoader,
        {
            once: true
        }
    );
} else {
    startExcelAutoLoader();
}