// profile_main.js 
// for Map_Profile.html
// 2021-12-06
// 在地圖上開新視窗，展示最短路徑上的縱剖面圖
// @ts-check

"use strict";
import { ProfileChart } from './MapProfileChart.js';

/**
 * 儲存從 API 獲取的縱剖面資料 (JSON 格式)。
 * @type {any}
 */
export var profileChart;

/**
 * 產生一個空的示範資料物件。
 * 用於展示範例時無資料的情況。
 *
 * @returns {object} 空的示範資料物件
 */
export function BlankForDemo() {
    let head =
        { "Version": "Dijkstra演算法(無向性管網)", "ProjectId": "右昌", "SWMMInpFile": null, "StartNode": "091", "EndNode": "", "PublishDate": "2021-12-06 10:01:32", "LinkIds": null, "NodeIds": null, "PNodes": [], "PLinks": [], "Message": "起點節點:091，不存在!請檢查拼字是否正確。" };
    return head;
}

/**
 * 縱剖面圖表的標題字串。
 * @type {string}
 */
export var ProfileChartTitle = "";

/**
 * 顯示縱剖面資料表格。
 * 此函數會更新 DOM 中相應位置的表格標題與內容。
 * 
 * @private
 * @returns {void}
 */
function ShowProfileTable() {
    // 設定表格標題
    let title = "縱剖面管渠資料表";
    // @ts-ignore
    document.getElementById("table-title").innerHTML = title;

    // Profile Link table-title
    let tr;
    tr = ProfileChart.GenProfileTableTitle();
    // @ts-ignore
    document.getElementById("Table-Title").innerHTML = tr;

    // Profile Link table
    tr = profileChart.GenProfileTable();
    // @ts-ignore
    document.getElementById("Profile-Link-Table").innerHTML = tr;

    // Profile Node table-title
    tr = ProfileChart.GenProfileTable_Nodes_Title();
    // @ts-ignore
    document.getElementById("Table2-Title").innerHTML = tr;

    // Profile Node table
    // tr = profileChart.GenProfileTable_Nodes();
    // console.log({tr : tr})
    // document.getElementById("Profile-Node-Table").innerHTML = tr;
}

/**
 * 產生縱剖面圖的標題。
 *
 * @param {{ PNodes: any[] }} PathData - 包含節點資料的物件，必須具有 PNodes 屬性。
 * @returns {string} 縱剖面圖的標題字串
 */
export var gen_ProfileChartTitle = function (/** @type {{ PNodes: any; }} */ PathData) {
    // 從 PNodes 取得起始與結束節點的 ID 作為標題
    let node = PathData.PNodes;
    let FromNode = node[0].ID;
    let n = node.length;
    let ToNode = node[n - 1].ID;
    let title = `從${FromNode}到${ToNode}管段`;
    return title;
}

/**
 * 繪製縱剖面圖。
 *
 * @param {string} id - DOM 元素 id，縱剖面圖繪製區域對應的 id。
 * @param {any} PathData - 縱剖面圖的路徑資料，包含節點與管渠的基本資料。
 * @param {any} project - 專案名稱或相關資訊。
 * @param {boolean} isShowTable - 是否顯示縱剖面圖相關的資料表，true 表示顯示，false 表示不顯示。
 * @param {{
 *   Version: string;
 *   ProjectId: string;
 *   SWMMInpFile: any;
 *   StartNode: string;
 *   EndNode: string;
 *   PublishDate: string;
 *   LinkIds: any;
 *   NodeIds: any;
 *   PNodes: any[];
 *   PLinks: any[];
 *   Message: string;
 * }} head - 縱剖面圖使用的頭部訊息資料。
 */
export function Profile_main(id, PathData, project, isShowTable, head) {
        
    // 若 DOM 元素不存在或路徑資料為空則不進行繪圖
    if (PathData ===undefined || document.getElementById(id) === null) return;

    // 清除前一次的縱剖面圖
    if (profileChart !== null) {
        profileChart = null;
    }

    // 建立新的縱剖面圖表實例，並繪製圖表
    profileChart = new ProfileChart(head, PathData, `#${id}`);

    // 是否顯示相關資料表，預設為不顯示
    isShowTable = isShowTable || false;
    if (isShowTable)
        ShowProfileTable();

    // 繪製主要的縱剖面圖
    profileChart.PlotProfileMain();
};
