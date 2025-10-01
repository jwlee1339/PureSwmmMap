// dfs_shuffle.js for Index.html
// 原始路徑 : D:\home\05_jwlee\01_DFSjs\DFS_Shuffle.js
// 目前路徑 : D:\home\2_MIT\02_基隆市專案\PureSwmmMap\SwmmMap\MapDisplay\dfs_shuffle\dfs_shuffle.js
// 日期: 2023-11-30
// 功能: 測試深度優先搜尋 (DFS) 結合管段順序的亂數排列，用於尋找隨機路徑。

import { myAlert, REDCOLOR } from "../myAlert.js";

// for dfs-shuffle
import { DepthFirstSearch } from "./dfs.js";
import { CompareArrays, PrepareDFS } from "./shuffle.js";

// 專案節點資料
let PNodes = {
    SwmmNodes: {}
};

// 專案管線資料
let PLinks = {
    SwmmLinks: {}
};
export function getPNodes(){
    return PNodes;
}
export function getPLinks(){
    return PLinks;
}


// 圖論演算法用的圖形物件
let Graph;
// 歷次搜尋路徑結果，不重複
let TotalPaths = [];

// 使用者上一次的指定起迄節點
let LastStartNode, LastEndNode;

/**
 * @typedef {object} SwmmNode - 代表 SWMM 網路中的一個節點（人孔、排放口等）。
 * @property {string} ID - 節點的唯一識別碼 (例如 "J1", "O1")。
 * @property {string} type - 節點類型 (例如 "JUNCTION", "OUTFALL", "STORAGE")。
 * @property {number} Invert - 節點的管底高程。
 * @property {number} MaxDepth - 節點的最大深度（地面高程 - 管底高程）。
 * @property {string[]} aLink - 連接到此節點的所有管線 ID 陣列。
 * @property {number} PathLength - 在路徑計算中使用的路徑長度，通常在計算後更新。
 * @property {number} TopElevation - 節點的頂部高程（即地面高程）。
 */

/**
 * @typedef {object} SwmmLink - 代表 SWMM 網路中的一個管線（連結）。
 * @property {string} ID - 管線的唯一識別碼。
 * @property {string} Type - 管線類型 (例如 "CONDUIT")。
 * @property {boolean} Marked - 演算法中使用的標記，表示是否已訪問。
 * @property {string} FromNode - 管線的起始節點 ID。
 * @property {string} ToNode - 管線的結束節點 ID。
 * @property {number} Length - 管線長度。
 * @property {number} Height - 管線高度或直徑。
 * @property {number} InOffset - 入口管底與節點管底的高程差。
 * @property {number} OutOffset - 出口管底與節點管底的高程差。
 */

/** 
 * 從外部設定 PNodes 和 PLinks 的全域變數。
 * @param {SwmmNode[]} pnodes - 節點資料陣列。
 * @param {SwmmLink[]} plinks - 管渠資料陣列。
 *  */ 
export function SetPNodesPLinks(pnodes, plinks) {
    PNodes['SwmmNodes'] = pnodes;
    PLinks['SwmmLinks'] = plinks;
    console.log("PNodes, PLinks已經設定好了")
    // console.log({ PNodes });
    // console.log({ PLinks });
}


/**
 * 取得歷次搜尋到的所有不重複路徑。
 * @returns {string[]}
 */
export function GetTotalPaths() {
    return TotalPaths;
}

/** 讀取PNodes.json */
async function GetPNodes(Prefix) {
    // 創建一個 AbortController 物件
    const controller = new AbortController();

    // 設置一個 5 秒的超時計時器
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    // 檔案位置相對於網頁HTML
    let URL = `./SwmmMap/MapDisplay/Data/${Prefix}_PNodes.json`;
    // 使用 await 等待 fetch 函數的返回值
    const response = await fetch(URL, { signal: controller.signal });
    // 使用 await 等待 json () 方法的返回值
    const data = await response.json();
    // 回傳 JSON 數據
    return data;
}
/**
 * 根據起點和終點節點的 ID，無方向性地尋找對應的管渠。
 * @param {string} FromNode - 起點節點 ID。
 * @param {string} ToNode - 終點節點 ID。
 * @returns {{ID:string, Type:string, Marked:bool, FromNode:string,
        ToNode:string, Length:number, Height:number, InOffset:number, 
        OutOffset:number}}
 */
function FindLinkByTwoNodesUndir(FromNode, ToNode) {
    let a = PLinks.SwmmLinks.filter(x => x.FromNode === FromNode && x.ToNode === ToNode);
    if (a.length > 0)
        return a[0];
    else {
        // 反過來再試一次
        a = PLinks.SwmmLinks.filter(x => x.FromNode === ToNode && x.ToNode === FromNode);
        if (a.length > 0)
            return a[0];
    }
    return null;
}



/**
 * 檢查指定的節點 ID 是否存在於 PNodes 資料中。
 * @param {string} Node - 要檢查的節點 ID。
 * @returns {boolean} - 如果存在則返回 true，否則返回 false。
 */
function isNodeExisted(Node) {

    try {
        let snode = PNodes.SwmmNodes.filter(x => x.ID === Node);
        if (snode.length === 0) {
            let message = `Node:${Node}不存在!`;
            console.log(message);
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        console.log({ PNodes });
        return false;
    }
}

/** 讀取PNodes.json */
/** 
 * 從伺服器非同步讀取 PLinks.json 檔案。
 * @param {string} Prefix - 專案前綴，用於構建檔案路徑。
 * @returns {Promise<object>} - 包含管線資料的 Promise 物件。
 */
async function GetPLinks(Prefix) {
    // 創建一個 AbortController 物件
    const controller = new AbortController();

    // 設置一個 5 秒的超時計時器
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    // 檔案位置相對於網頁HTML
    let URL = `./SwmmMap/MapDisplay/Data/${Prefix}_PLinks.json`;
    // 使用 await 等待 fetch 函數的返回值
    const response = await fetch(URL, { signal: controller.signal });
    // 使用 await 等待 json () 方法的返回值
    const data = await response.json();
    // 回傳 JSON 數據
    return data;
}

/**
 * 給定節點 ID 的 CSV 字串，向後端請求繪圖所需的完整路徑資料。
 * @param {string} NodeCsv - 節點 ID 的逗號分隔字串，例如 "D18,D17-1"。
 * @returns {Promise<object>} - 包含路徑繪圖資料的 Promise 物件。
 */
export async function GetPathDataFromServer(NodeCsv) {

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerHTML = `<span class="gadge bg-warning text-black">讀取中...</span>`;

    // 創建一個 AbortController 物件
    const controller = new AbortController();

    // 設置一個 5 秒的超時計時器
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let projectId = document.getElementById("project-select").value;
    // 檔案位置相對於網頁HTML
    let URL = `./SwmmMap/MapDisplay/asp/GetPathData.aspx?ProjID=${projectId}&NodeCsv=${NodeCsv}`;
    // 使用 await 等待 fetch 函數的返回值
    const response = await fetch(URL, { signal: controller.signal });
    // 使用 await 等待 json () 方法的返回值
    const data = await response.json();
    indicator.innerText = "";

    // 回傳 JSON 數據
    return data;
}

/**
 * 使用深度優先搜尋 (DFS) 演算法尋找單一路徑。
 * @param {string} StartNode - 起始節點 ID。
 * @param {string} EndNode - 結束節點 ID。
 * @returns {string[]} - 包含路徑節點 ID 的陣列。
 */
export function FindSinglePathByDFS(StartNode, EndNode) {

    // DFS 演算法搜尋路徑
    let DFS = new DepthFirstSearch(Graph, StartNode, EndNode);
    let path = DFS.FindPath();
    //console.log(path);
    // 如果尚未儲存，也不重複，就存入串列
    let compare_result = false;
    for (let i = 0; i < TotalPaths.length; i++) {
        let arr1 = TotalPaths[i];
        if (compare_result = CompareArrays(arr1, path)) break;
    }
    if (!compare_result) TotalPaths.push(path);
    //console.log(`TotalPaths.length:${TotalPaths.length}`);
    return path;
}

/**
 * 檢查起始和結束節點是否存在於資料中。
 * @param {string} StartNode - 起始節點 ID。
 * @param {string} EndNode - 結束節點 ID。
 * @returns {boolean} - 如果兩個節點都存在，返回 true，否則返回 false。
 */
function IsNodesExisted(StartNode, EndNode) {
    if (!isNodeExisted(StartNode)) {
        console.error(`[ERROR]節點:${StartNode}不存在!`);
        return false;
    } else
        console.log(`節點:${StartNode}已存在!`);

    if (!isNodeExisted(EndNode)) {
        console.error(`[ERROR]節點:${EndNode}不存在!`);
        return false;
    } else console.log(`節點:${EndNode}已存在!`);

    return true;
}

/** 
 * 讀取指定專案的節點與管段資料。
 * (注意：此函式名稱與另一個 GetPNodes 重複，但參數不同，應為 GetPNodesAndPLinks)
 * @param {string} Prefix - 專案前綴，例如 "DM"。
*/
export async function GetPNodesPLinks(Prefix) {
    PNodes = await GetPNodes(Prefix);
    PLinks = await GetPLinks(Prefix);
    console.log("PNodes, PLinks資料讀取完畢! Ready for DFS");
}

/**
 * 執行 DFS 亂數路徑搜尋的主函式。
 * 此函式會從 UI 讀取起迄點，執行搜尋，並觸發後端請求以取得繪圖資料。
 * @param {string} StartNode - 起始節點名稱
 * @param {string} EndNode - 終點節點名稱
 * @returns {string[] | undefined} - 路徑上的節點名稱串列 或 undefined
 */
export function RunDFSShuffle(StartNode, EndNode) {

    // 驗證節點是否存在
    if (!IsNodesExisted(StartNode, EndNode)) return;

    // 是否清除歷次搜尋結果
    if (StartNode === LastStartNode || EndNode === LastEndNode)
         TotalPaths = [];

    // 準備DFS資料, 打亂原有的管段順序
    console.log("準備DFS資料, 打亂原有的管段順序")
    LastStartNode = StartNode;
    LastEndNode = EndNode;

    Graph = PrepareDFS(PNodes, PLinks,
         { shuffle: true, direction: 'bidirectional'});

    // console.log({Graph});
    // 搜尋單一路徑
    let NodeIds = FindSinglePathByDFS(StartNode, EndNode);
    // console.log({NodeIds})
    if (NodeIds === undefined) {
        console.warn("dfs-shuffle,無路徑!")
        return; // 如果找不到路徑，則提前返回
    }

    // -----
    if (NodeIds.length < 2) {
        let msg = `[DFS亂數路徑]路徑節點數少於2個!`;
        //document.getElementById('msg').innerHTML = ;
        myAlert(msg, REDCOLOR, 10000);
        return;
    }

    // 將NodeIds轉換為CSV
    let NodeCsv = NodeIds.toString(",");
    console.log({ NodeCsv });
    
    return NodeIds;
}

/**
 * 根據給定的起點和終點節點名稱，直接尋找一條路徑。
 * @param {string} StartNode - 起點節點 ID。
 * @param {string} EndNode - 終點節點 ID。
 * @returns {string[] | undefined} - 返回找到的路徑節點陣列，如果資料未載入則返回 undefined。
 */
export function FindPathByStartEndNode(StartNode, EndNode) {
    // 檢查是否有SWMM節點及管段資料
    if (PNodes === undefined || PLinks === undefined) {
        console.error("缺PNodes, PLinks資料!");
        return;
    }
    Graph = PrepareDFSByShuffle(PNodes, PLinks);
    let NodeIds = FindSinglePathByDFS(StartNode, EndNode);
    return NodeIds;
}
