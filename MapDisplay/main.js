/// <reference path="dfs_shuffle/dfs_shuffle.js" />
// main.js for yu_map.html
// 2021-11-12
// 2021-12-03
// 2023-12-09 改寫為lit-html 版本

'use strict'


// 流域邊界Polygon
import { ReadAreaBorder } from "./DrawBorder/ReadAreaBorder.js";
import { Base } from "./GetBaseData.js";
import { FetchBaseData, FetchData } from "./FetchBaseData.js";
// 右側控制盤
import { RightPanel } from "./RightPanel.js";
// 查詢使用者指定路徑
import { RequestQueryPath } from "./RequestData.js";
import { Utils } from "./Utils.js";
import {
    SwmmMap, StartDrawSwmm, IsShowArrowHead
} from "./MapResults/SwmmMapService.js";
// 設定節點與管渠資料
import { SetPNodesPLinks } from "./dfs_shuffle/dfs_shuffle.js";


// DOM 
/**
 * @type {HTMLElement}
 * @description 專案選擇的下拉選單元素。
 */
let projectId_el;


// 縱剖面視窗可移動
$("#profile-chart").draggable();
// 防止拖移面板時影響 leaflet 地圖
$("#profile-chart").on("mousedown touchstart", function (e) {
    L.DomEvent.stopPropagation(e);
});

// 設定初始z-index小於400，所以在地圖之下。
$(".chart-container").css("z-index", 100);

// 表格可移動
$("#user-paths-edit-table").draggable();

// 取得參數
/**
 * 從 URL 的查詢字串中取得指定參數的值。
 * @param {string} parameterName - 要尋找的參數名稱，例如 'projectID'。
 * @returns {string|null} 參數的值，如果找不到則返回 null。
 * @example
 * // 若 URL 是 "http://example.com?projectID=TY_DMCREEK&user=test"
 * findGetParameter('projectID'); // 回傳 "TY_DMCREEK"
 */
function findGetParameter(parameterName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(parameterName);
}


// ----- Start here -----

/**
 * @global
 * @description 頁面載入完成後執行的主要函式。
 * 負責初始化地圖、讀取資料、設定使用者介面及事件監聽。
 */
window.onload = async function () {

    // -----
    // 生成右側控制盤 使用lit-html
    let right_panel_container = document.getElementById("right-panel");
    let right_panel = new RightPanel(right_panel_container);
    right_panel.Render();
    // -----

    // 抓取DOM - 暫時
    projectId_el = document.getElementById("project-select")

    // 打開或關閉按鈕
    /** @type {HTMLElement} */
    let open_right_panel_el = document.getElementById("open-right-panel");
    // 右側控制盤按鈕
    /** @type {HTMLElement} */
    let right_panel_el = document.getElementById("right-panel");
    // 編輯路徑資料按鈕
    /** @type {HTMLElement} */
    let open_path_edit_panel_el = document.getElementById("open-path-edit-panel");
    // 編輯路徑資料表格
    /** @type {HTMLElement} */
    let user_paths_edit_table_el = document.getElementById("user-paths-edit-table");


    let fn = "TY_DMCREEK";
    // 讀取SWMM空間基本資料 - 檔案
    Base.data = await FetchBaseData(fn);

    // 讀取東門溪流域邊界Polygon - 檔案
    ReadAreaBorder();

    // 開始繪製SWMM基本圖
    StartDrawSwmm(Base.data, true, IsShowArrowHead);

    // 從檔案取得PNodes, PLinks
    const pnodes = await FetchData("DM_PNodes.json");
    const plines = await FetchData("DM_PLinks.json");
    SetPNodesPLinks(pnodes["SwmmNodes"], plines["SwmmLinks"]);

    // ----- Right Panel -----
    /**
     * @description [打開]或[關閉]右側控制盤的點擊事件處理函式。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    open_right_panel_el.onclick = (e) => {

        let innerText = e.target.innerText;
        console.log({ innerText })

        // "打開" 或 "關閉"
        if (innerText.includes("關閉")) {
            e.target.innerText = "打開";
            // 按鈕的顏色
            open_right_panel_el.classList.remove("bg-danger");
            open_right_panel_el.classList.add("bg-primary");
            console.log("打開右側控制盤");
            right_panel_el.classList.add("hide-right-panel");
            right_panel_el.classList.remove("show-right-panel");
        } else {
            e.target.innerText = "關閉";
            // 按鈕的顏色
            open_right_panel_el.classList.add("bg-danger");
            open_right_panel_el.classList.remove("bg-primary");
            console.log("關閉控制盤");
            right_panel_el.classList.add("show-right-panel");
            right_panel_el.classList.remove("hide-right-panel");
        }
    }

    /**
     * @description [開啟路徑編輯]表格的點擊事件處理函式。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    open_path_edit_panel_el.onclick = async (e) => {

        let innerText = e.target.innerText;
        console.log({ innerText })

        // "打開" 或 "關閉"
        if (innerText.includes("關閉")) {
            e.target.innerText = "開啟路徑編輯表";
            // 按鈕的顏色
            open_path_edit_panel_el.classList.remove("bg-danger");
            open_path_edit_panel_el.classList.add("bg-primary");
            console.log("開啟路徑編輯");
            user_paths_edit_table_el.classList.add("hide-right-panel");
            user_paths_edit_table_el.classList.remove("show-right-panel");
        } else {
            e.target.innerText = "關閉路徑編輯表";
            // 按鈕的顏色
            open_path_edit_panel_el.classList.add("bg-danger");
            open_path_edit_panel_el.classList.remove("bg-primary");
            console.log("開啟路徑編輯");
            user_paths_edit_table_el.classList.add("show-right-panel");
            user_paths_edit_table_el.classList.remove("hide-right-panel");

            // 改為webview2 version
            let Prof_id = ``; // blank, get all user paths
            // 向後端請求資料, 資料夾是相對於html
            RequestQueryPath(Prof_id);
        }
    }
}

/**
 * @description 視窗大小改變時觸發的事件處理函式。
 * 目前為空，可擴充以實現響應式佈局調整。
 */
window.onresize = function () {

};