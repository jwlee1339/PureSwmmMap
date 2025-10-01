// D:\home\1_崇峻\SwmmWebview2V2\Work\PureSwmmMap\SwmmMap\MapDisplay\RequestData.js
// 2024-06-18
// 向c#請求資料 webview2 version, 不好用!

'use strict'


// 繪製多條排水路徑圖
import { DrawPaths } from "./DrawSwmm/DrawPath.js"
// SWMM空間資料 集水區、節點、管段等基本資料
import { Base } from "./GetBaseData.js";

import { myAlert } from "./myAlert.js";

import { Utils } from './Utils.js';

import { UserTable } from "./Tablejs/UserTable.js";

import {
    SwmmMap, StartDrawSwmm, IsShowArrowHead
} from "./MapResults/SwmmMapService.js";

import { SetPNodesPLinks } from "./dfs_shuffle/dfs_shuffle.js";

/** C#後端傳送來的最短路徑串列 - 提供繪製縱剖面圖 */
// 1. 宣告一個可匯出的變數，初始值為空陣列
export let Paths = [];

// 使用者指定路徑表
let user_table;

function RequestData(requestStr) {
    let now = new Date();
    let nowString = Utils.DateToYYYYMMDDHHMMSS_Dash(now);
    // Triggered by a button on the HTML page
    if (Utils.IsWebViewAvailable())
        window.chrome.webview.postMessage(`${requestStr}`);
    else
        console.error("WebView is not available!");
}

//!-----載入後，立刻執行
if (Utils.IsWebViewAvailable()) {
    
    // [註冊]js 接收 c# 傳送來的資料
    window.chrome.webview.addEventListener('message', event => {
        // Handle the received message (e.g., alert or process data)
        // console.log("Receieved event.data:", event.data);
        let json = JSON.parse(event.data);

        // 先檢查頭部文字 是哪個程序要求的結果
        if (json['Name'] === 'DijkstraPath') {
            // 存入global variables
            Paths = json['Paths'];

            // 解構json
            let Version = Paths[0]['Version'];          //"Dijkstra演算法(無向性管網)",
            let SwmmInpFile = Paths[0]["SWMMInpFile"];  // "D:\\SWMM_related\\SwmmWebview2\\Work\\inp\\TY_DMCREEK.inp",
            let StartNode = Paths[0]["StartNode"];      // "D19",
            let EndNode = Paths[0]["EndNode"]           // "D18-3",
            let PublishDate = Paths[0]["PublishDate"];  // "2024-06-18 14:20",

            document.getElementById('msg').innerText = `${Version},${StartNode},${EndNode},${PublishDate}`;

            DrawPaths(SwmmMap, Paths, Base.data);
            // 啟用動態路徑按鈕
            // 繪製動態路徑按鈕
            let draw_animated_path_el = document.getElementById("draw-animate-path");
            draw_animated_path_el.disabled = false;
        } 
        // 從已知路徑節點，取得路徑縱剖面資料
        else if (json['Name'] === 'DFSShuffle') {
            // 存入global variables
            Paths = json['Paths'];
            // 解構json
            let Version = Paths[0]['Version'];          //"DFSShuffle",
            let SwmmInpFile = Paths[0]["SWMMInpFile"];  // "D:\\SWMM_related\\SwmmWebview2\\Work\\inp\\TY_DMCREEK.inp",
            let StartNode = Paths[0]["StartNode"];      // "D19",
            let EndNode = Paths[0]["EndNode"]           // "D18-3",
            let PublishDate = Paths[0]["PublishDate"];  // "2024-06-18 14:20",

            document.getElementById('msg').innerText = `${Version},${StartNode},${EndNode},${PublishDate}`;
            DrawPaths(SwmmMap, Paths, Base.data);
            // 啟用動態路徑按鈕
            // 繪製動態路徑按鈕
            let draw_animated_path_el = document.getElementById("draw-animate-path");
            draw_animated_path_el.disabled = false;
        }
        // 新增路徑資料於DB
        else if (json['Name'] === 'InsPath') {
            console.log("[InsPath]Receive data form c#");
            document.getElementById("msg").innerText = `[InsPath]${json['Result']},${json['Message']}`;
        }
        // 查詢儲存於DB的路徑資料
        else if (json['Name'] === 'QueryPath') {
            console.log("[QueryPath]Receive data form c#");
            console.table(json['UserPaths'])
            user_table = new UserTable("user-paths-edit-table");
            user_table.ShowData(json['UserPaths']);
        }
        // 刪除DB路徑節點資料
        else if (json['Name'] === "DeletePath") {
            console.log("[DeletePath]Receive data form c#");
            document.getElementById("msg").innerText = `[DeletePath]${json['Result']},${json['Message']}`;
            // 更新表格
            RequestQueryPath("");
        } 
        // 取得SWMM空間資料、PNodes, PLinks資料
        else if (json["Name"] === "SwmmBaseData") {
            let s = json['SwmmBaseDataString'];
            // 取得dfs_shuffle路徑資料
            let PNodes = json['PNodes'];
            let PLinks = json['PLinks'];
            // console.log({PNodes});
            // console.log({PLinks});
            // 存入資料提供 dfs_shuffle使用
            SetPNodesPLinks(PNodes, PLinks);

            // 再解析一次
            Base.data = JSON.parse(s);
            // 開始繪製SWMM基本圖
            StartDrawSwmm(Base.data, true, IsShowArrowHead);
            // 預設:停止移動地圖
            SwmmMap.dragging.disable();
            document.getElementById('msg').innerText = `已取得SWMM空間資料、PNodes, PLinks資料(dfs_shuffle使用)`;
        } 
        // 取得節點到所有出口的路徑
        else if (json['Name'] === 'DijkstraAllPaths') {
            console.log("DijkstraAllPaths")
            // 存入global variables
            Paths = json['Paths'];
            // 解構json
            let StartNode = Paths[0]["StartNode"];      // "D19",
            let PublishDate = Paths[0]["PublishDate"];  // "2024-06-18 14:20",

            document.getElementById('msg').innerText = `所有到達出水口的路徑:StartNode:${StartNode},${PublishDate}`;
            DrawPaths(SwmmMap, Paths, Base.data);
            // 啟用動態路徑按鈕
            // 繪製動態路徑按鈕
            let draw_animated_path_el = document.getElementById("draw-animate-path");
            draw_animated_path_el.disabled = false;
        }
        else {
            console.error(`Name=${json['Name']},無法處理!`);
        }
    });
} else {
    console.warn("WebView is not existed!");
}
//-----

/**
 * Dijkstra演算法搜尋最短路徑(最少節點)
 */
export function GetShortestPath() {

    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    let EndNode = document.getElementById("user-EndNode").value;
    console.log(FromNode.length, EndNode);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("FromNode is undefined or null or '' !", "red");
        return;
    }
    FromNode = FromNode.trim();
    EndNode = EndNode.trim();

    // 相對於html 路徑
    let URL = `DijkstraPath?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    // http://forecast.chongjun.tw:8099/11_PureSwmmMap/
    // ./SwmmMap/MapDisplay/asp/DijkstraPath.aspx?ProjID=TY_DMCREEK&StartNode=TS-T5&EndNode=TY-T1
    console.log(URL);

    // 提出請求
    RequestData(URL);

    return;
}


/**
 * Dijkstra演算法搜尋所有到達出水口的最短路徑(最少節點)
 */
export function GetDijkstraAllPaths() {

    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    console.log("GetDijkstraAllPaths()", FromNode.length);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("FromNode is undefined or null or '' !", "red");
        return;
    }
    FromNode = FromNode.trim();

    // 相對於html 路徑
    let RequestString = `DijkstraAllPaths?ProjID=${projectId}&StartNode=${FromNode}`;
    console.log(RequestString);

    // 提出請求
    RequestData(RequestString);

    return;
}

/**
 * 向後端請求存入使用者路徑資料至DB
 * @param {string} ProfId 排水路徑名稱, ex."D19~D17"
 * @param {string} Nodes 路徑上的節點名稱, ex."D19,D18,D17"
 * @param {string} UserId 使用者名稱, ex. "jwlee"
 */
export function RequestInsPath(projectId, ProfId, Nodes, UserId) {
    // 西元年
    let now = new Date();
    let InsDateTime = Utils.DateToYYYYMMDDHHMMSS_Dash(now);
    let requestStr = `InsPath?ProjID=${projectId}&ProfId=${ProfId}&Nodes=${Nodes}&UserId=${UserId}&InsDateTime=${InsDateTime}`;
    console.log(requestStr);
    // Triggered by a button on the HTML page
    window.chrome.webview.postMessage(`${requestStr}`);
}

export function RequestQueryPath(ProfId) {
    let projectId = document.getElementById("project-select").value;
    let requestStr = `QueryPath?ProjID=${projectId}&ProfId=${ProfId}`;
    console.log(requestStr);
    // Triggered by a button on the HTML page
    window.chrome.webview.postMessage(`${requestStr}`);
}

export function RequestDeletePath(ProfId) {
    let projectId = document.getElementById("project-select").value;
    let requestStr = `DeletePath?ProjID=${projectId}&ProfId=${ProfId}`;
    console.log(requestStr);
    // Triggered by a button on the HTML page
    window.chrome.webview.postMessage(`${requestStr}`);
}


