// ReadDataFromServer.js
// 從後端伺服器請求資料
// 2021-12-13

'use strict'


// API位址
import { BaseUrl } from '../Common/BaseURL.js';

// 排水路徑
import { ClearAllPaths, DrawPaths, DrawSinglePath } from "./DrawSwmm/DrawPath.js"

import { SwmmMap } from "./MapResults/SwmmMapService.js";

import { myAlert } from "./myAlert.js";

// 剖面資料，必須使用物件，否則其他模組不能改變其值
import { Path } from './GetPathData.js';

/**
 * Dijkstra 演算法搜尋兩點最短路徑
 * @param {any} data
 */
export function FindShortestPath(data) {

    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    let EndNode = document.getElementById("user-EndNode").value;
    // console.log(FromNode.length, EndNode);

    if (FromNode == undefined || FromNode == null || EndNode == undefined || EndNode == null || FromNode.length === 0 || EndNode.length === 0) {
        myAlert("排水路徑起點與終點不可為空白!", "red");
        return;
    }
    FromNode = FromNode.trim();
    EndNode = EndNode.trim();

    // 清除路徑
    ClearAllPaths();

    // 呼叫API，取得排水路徑
    let b = FetchShortestPath(FromNode, EndNode);

    b.then((json) => {
        // console.log(json);
        // start draw path on map
        if (json === null || json.length == 0) {
            // alert('無資料!');
            myAlert(`API無資料`, "red");
            return;
        }

        Path.data = json;

        let PathNumber = json.length;
        if (json[0].LinkIds != null) {
            myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, "green");
            DrawPaths(SwmmMap, json, data);
        } else {
            // console.log(json);
            myAlert(`API回傳:${json[0].Message}`, "red");
        }
    }).catch(x => {
        myAlert(x, "red");
    });
}
/**
 * DijkstraPath
 * @param {string} FromNode
 * @param {string} EndNode
 * @returns
 */
function FetchShortestPath(FromNode, EndNode) {

    let projectId = document.getElementById("project-select").value;

    let URL = `./SwmmMap/MapDisplay/asp/DijkstraPath.aspx?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };

    let a = fetch(URL)
        .then(function (response) {
            if (response.status >= 200 && response.status <= 299) {
                return response.json();
            } else {
                throw Error(response.statusText);
            }
        })
        .then(function (json) {
            return json;
        }).catch(x => {
            console.log('Error in fetch or time out = 10 seconds. message : ', x);
        }).finally(() => {
            indicator.innerText = "";
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        });
    return a;
}

/**
 * Dijkstra 演算法搜尋所有可能路徑
 * @param {any} BaseData
 */
export function GetPossiblePathsByAjax(BaseData) {
    let timeout = 30 * 1000; // milliseconds
    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    // console.log(FromNode.length);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("排水路徑起點不可為空白!", "red");
        return;
    }
    FromNode = FromNode.trim();

    let URL = `./SwmmMap/MapDisplay/asp/ToAllOutPath.aspx?ProjID=${projectId}&StartNode=${FromNode}`;
    console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };

    // 清除路徑
    ClearAllPaths();

    $.ajax({
        type: "GET",
        url: URL,
        dataType: 'json',
        async: true,
        success: function (json) {
            // console.log(json);
            // start draw path on map
            if (json === null || json.length == 0) {
                // alert('無資料!');
                myAlert(`API無資料`, "red");
                return;
            }

            Path.data = json;

            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, "green");
                DrawPaths(SwmmMap, json, BaseData);
            } else {
                myAlert(`API回傳:${json[0].Message}`, "red");
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, "red");
        },
        complete: function () {
            indicator.innerText = "";
            // 完成後，會執行這裡
            // btn.disabled = false;
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        },
        timeout: timeout
    }).done(function (json) {
    });
}


/**
 * BFS 演算法搜尋最短路徑(最少節點), test OK @2023-11-21
 * @param {any} BaseData
 */
export function GetBFSPathsByAjax(BaseData) {

    let timeout = 50 * 1000; // milliseconds
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
    // let URL = `./SwmmMap/MapDisplay/asp/BFSPath.aspx?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    // BFSPath?ProjID=KEELUNG&StartNode=D18&EndNode=D13
    let URL = `BFSPath?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerHTML = `<span class="badge bg-warning text-black">計算中...<span>`;

    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };

    // 清除路徑
    ClearAllPaths();

    $.ajax({
        type: "GET",
        url: URL,
        dataType: 'json',
        async: true,
        success: function (json) {
             console.log(json);
            // start draw path on map
            if (json === null || json.length == 0) {
                // alert('無資料!');
                myAlert(`API無資料`, "red");
            }

            Path.data = json;

            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, "green");
                DrawPaths(SwmmMap, json, BaseData);
            } else {
                myAlert(`API回傳:${json[0].Message}`, "red");
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            console.log("Status : " + status);
            console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, "red");
        },
        complete: function () {
            indicator.innerText = "";
            // 完成後，會執行這裡
            // btn.disabled = false;
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        },
        timeout: timeout
    }).done(function (json) {

    });
}


/**
 * Lee改良版演算法搜尋兩點最短路徑 - not yet
 * @param {any} BaseData
 */
export function FindShortestPath_Lee(BaseData) {
    let timeout = 30 * 1000; // milliseconds
    // http://localhost:55442/api/Path/PathLee?ProjectId=TYYU_DEMO_A&StartNode=yu7.41&EndNode=yu5.2
    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    let EndNode = document.getElementById("user-EndNode").value;
    // console.log(FromNode.length, EndNode);

    if (FromNode == undefined || FromNode == null || EndNode == undefined || EndNode == null || FromNode.length === 0 || EndNode.length === 0) {
        myAlert("排水路徑起點與終點不可為空白!", "red");
        return;
    }
    FromNode = FromNode.trim();
    EndNode = EndNode.trim();
    // 清除路徑
    ClearAllPaths();
    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;
    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };
    // http://localhost:55442/api/Path/PathLee?ProjectId=TYYU_DEMO_A&StartNode=yu7.41&EndNode=yu5.2
    let URL = `${BaseUrl}/api/Path/PathLee?ProjectId=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    // console.log(URL);

    $.ajax({
        type: "GET",
        url: URL,
        dataType: 'json',
        async: true,
        success: function (json) {
            // console.log(json);
            // start draw path on map
            if (json === null || json.length == 0) {
                // alert('無資料!');
                myAlert(`API無資料`, "red");
                return;
            }

            Path.data = json;

            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, "green");
                // 繪製路徑平面圖
                DrawPaths(SwmmMap, json, BaseData);
            } else {
                myAlert(`API回傳:${json[0].Message}`, "red");
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, "red");
        },
        complete: function () {
            indicator.innerText = "";
            // 完成後，會執行這裡
            // btn.disabled = false;
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        },
        timeout: timeout
    }).done(function (json) {
    });
}

// *********************************
// * Lee改良版演算法搜尋所有可能路徑 *
// *********************************
// ajax version，30秒限制

/**
 * @param {any} BaseData
 */
export function GetPossiblePaths_Lee(BaseData) {
    let timeout = 30 * 1000; // milliseconds
    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    // console.log(FromNode.length);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("排水路徑起點不可為空白!", "red");
        return;
    }
    FromNode = FromNode.trim();

    // http://localhost:55442/api/Path/AllPathsLee?ProjectId=TYYU_DEMO_A&StartNode=yu8
    let URL = `${BaseUrl}/api/Path/AllPathsLee?ProjectId=${projectId}&StartNode=${FromNode}`;
    // console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };

    // 清除路徑
    ClearAllPaths();

    $.ajax({
        type: "GET",
        url: URL,
        dataType: 'json',
        async: true,
        success: function (json) {
            // console.log(json);
            // start draw path on map
            if (json === null || json.length == 0) {
                // alert('無資料!');
                myAlert(`API無資料`, "red");
                return;
            }

            Path.data = json;

            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, "green");
                // 繪製平面路徑圖
                DrawPaths(SwmmMap, json, BaseData);
            } else {
                myAlert(`API回傳:${json[0].Message}`, "red");
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, "red");
        },
        complete: function () {
            indicator.innerText = "";
            // 完成後，會執行這裡
            // btn.disabled = false;
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        },
        timeout: timeout
    }).done(function (json) {
    });
}

