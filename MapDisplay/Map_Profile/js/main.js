// main.js for Map_Profile.html
// 測試版本
// 2021-12-10


'use strict'

// API位址
import { BaseUrl } from '../../../Common/BaseURL.js';

// SWMM雨水下水道管網，路徑資料json。
import { GetPathData } from './path_data.js';

import { Profile_main, gen_ProfileChartTitle, BlankForDemo } from './Profile_main.js';

import { StringToDateTime } from './utils.js';
import { myAlert } from "../../myAlert.js"
import { ProfileChart } from './MapProfileChart.js';

// Global variables
let path = {}

let GreenColor = "#4CAF50";
let RedColor = "#f44336";
let BlueColor = "#2196F3";
let OrangeCOlor = "ff9800";

// ----------------------------------------------------------------
let profileChart;

// *********************************
// * Dijkstra 演算法搜尋兩點最短路徑 *
// *********************************

function FindShortestPath() {
    let timeout = 30 * 1000; // milliseconds
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
    // 呼叫API，取得排水路徑
    let URL = `${BaseUrl}/api/Path/ShortestPath?ProjectId=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    // console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;


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
            path.data = json;
            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, GreenColor);

                // 初始繪製縱剖面，使用空白水位
                let head = BlankForDemo();
                Profile_main("Chart_Hydrograph", path.data[0], projectId, true, head);

                let ProfileChartTitle = gen_ProfileChartTitle(path.data[0]);
                console.log({ ProfileChartTitle: ProfileChartTitle })
                document.getElementById('LinkID').innerHTML
                    = `# ${projectId}_${ProfileChartTitle}`;
            } else {
                // console.log(json);
                myAlert(`API回傳:${json[0].Message}`, RedColor);
            }

        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, RedColor);
        },
        complete: function () {
            indicator.innerText = "";
        },
        timeout: timeout
    }).done(function (json) {
    });
}


// *********************************
// * Dijkstra 演算法搜尋所有可能路徑 *
// *********************************
// ajax version，30秒限制

function GetPossiblePathsByAjax() {
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

    // http://localhost:55442/api/Path/PathsToOutfalls?ProjectId=TYYU_DEMO_A&StartNode=yu8
    let URL = `${BaseUrl}/api/Path/PathsToOutfalls?ProjectId=${projectId}&StartNode=${FromNode}`;
    // console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

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
            path.data = json;
            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, GreenColor);
                Draw_Profile();
            } else {
                myAlert(`API回傳:${json[0].Message}`, RedColor);
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, RedColor);
        },
        complete: function () {
            indicator.innerText = "";
        },
        timeout: timeout
    }).done(function (json) {
        // 完成後，會執行這裡
    });
}


// *********************************
// * BFS 演算法搜尋最短路徑(最少節點) *
// *********************************
// ajax version，30秒限制

function GetBFSPathsByAjax() {
    let timeout = 30 * 1000; // milliseconds
    let projectId = document.getElementById("project-select").value;
    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
    let EndNode = document.getElementById("user-EndNode").value;
    // console.log(FromNode.length, EndNode);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("排水路徑起點不可為空白!", "red");
        return;
    }
    FromNode = FromNode.trim();

    // http://localhost:55442/api/Path/BFS?ProjectId=%E9%BE%8D%E6%BD%ADv1&StartNode=3394585-01&EndNode=3394586-R1
    let URL = `${BaseUrl}/api/Path/BFS?ProjectId=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    // console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

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
            }
            path.data = json;
            let PathNumber = json.length;
            if (json[0].LinkIds != null) {
                myAlert(`API回傳:${json[0].Message}，共有${PathNumber}條可能路徑`, GreenColor);
                // DrawPaths(json, data);
                Profile_main("Chart_Hydrograph", path.data[0], projectId, true, json);
                let ProfileChartTitle = gen_ProfileChartTitle(path.data[0]);
                console.log({ ProfileChartTitle: ProfileChartTitle })
                document.getElementById('LinkID').innerHTML
                    = `# ${projectId}_${ProfileChartTitle}`;
            } else {
                myAlert(`API回傳:${json[0].Message}`, RedColor);
            }
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, RedColor);
        },
        complete: function () {
            indicator.innerText = "";
        },
        timeout: timeout
    }).done(function (json) {
    });
}

// BFS搜尋兩點間最短路徑 
$("#find-path-BFS").click(function () {
    GetBFSPathsByAjax();
});

// Dijkstra搜尋兩點間最短路徑 
$("#find-path").click(function () {
    FindShortestPath();
});

// Dijkstra搜尋所有路徑至出口
$("#find-AllPaths").click(function () {
    GetPossiblePathsByAjax();
});

// ----------------------------------------------------------------



// ----------------------------------------------------------------

// * 縱剖面初始化

// * 縱剖面初始化
function gen_profile_select() {
    let opt = "";
    for (let i = 0; i < path.data.length; i++) {
        opt += `<option>${path.data[i].EndNode}</option>`;
    }
    return opt;
}

let ProfileDiv_show = false;

// 繪製縱剖面
let Draw_Profile = function () {
    $(".chart-container").css("z-index", 410);
    $(".chart-container").show(ProfileDiv_show);
    let projectId = document.getElementById("project-select").value;

    // 初始繪製縱剖面，使用空白水位
    let head = BlankForDemo();
    Profile_main("Chart_Hydrograph", path.data[0], projectId, true, head);

    let ProfileChartTitle = gen_ProfileChartTitle(path.data[0]);
    // console.log({ ProfileChartTitle: ProfileChartTitle })
    document.getElementById('LinkID').innerHTML
        = `# ${projectId}_${ProfileChartTitle}`;

    // 以終點為選項
    let opt = gen_profile_select();
    document.getElementById("profile-select-div").innerHTML =
        `<select id="profile-select" class='text-small'>${opt}</select>`;

    // 註冊選擇縱剖面
    $("#profile-select").change(function () {
        // 清除所有最短路徑
        // ClearAllPaths();
        let value = $("#profile-select :selected").val();
        let index = document.getElementById("profile-select").selectedIndex;
        // myAlert(`Profile : ${value}, index :${index}`, "blue");

        // 初始繪製縱剖面，使用空白水位
        Profile_main("Chart_Hydrograph", path.data[index], projectId, true, head);

        ProfileChartTitle = gen_ProfileChartTitle(path.data[index]);
        document.getElementById('LinkID').innerHTML
            = `# ${projectId}_${ProfileChartTitle}`;
    });

    // 顯示或隱藏縱剖面按鈕
    $("#hide-Profile").attr('disabled', false);
};

// 顯示或隱藏縱剖面按鈕
$("#hide-Profile").click(function () {
    $(".chart-container").hide(ProfileDiv_show);
});
// 縱剖面視窗可移動
// $(".chart-container").draggable();
// 設定初始z-index小於400，所以在地圖之下。
$(".chart-container").css("z-index", 100);
// 顯示或隱藏縱剖面圖
$("#hide-Profile").attr('disabled', true);

// 縱剖面圖可放大縮小
// $(".flot-chart").resizable({
//     maxHeight: 600,
//     maxWidth: 1024,
//     minHeight: 220,
//     minWidth: 450
// });

// --------------------------------------------
// Get Profile Head from server
// 讀取縱剖面上各節點計算水位
// --------------------------------------------

function ReadProfileHeads(NodeCSV) {
    // console.log('ReadProfileHeads() : ');
    let projID_sel = document.getElementById("project-select");
    let projID = projID_sel.options[projID_sel.selectedIndex].value;

    // let leadMinutes = $("#FcstTime-Select :selected").val(); 
    // lead minutes ex. 10
    let sel = document.getElementById("FcstTime-Select");
    let leadMinutes = sel.options[sel.selectedIndex].value;
    // indicator
    let indicator1 = document.getElementById("Load-indicator1");
    indicator1.innerHTML = "讀取中";

    // http://localhost:55442/SwmmDemo/GetProfileResults/TYYU_DEMO_A/10?id_list=YU8%2CYU7.5%2CYU7.41
    // http://61.219.21.106:8089/SwmmDemo/GetProfileResults/TYYU_DEMO_A/0?id_list=YU8%2CYU7.5%2CYU7.41

    let URL = `${BaseUrl}/SwmmDemo/GetProfileResults/${projID}/${leadMinutes}?id_list=${NodeCSV}`;
    // console.log(URL);

    fetch(URL, { timeout: 30000 })
        .then(function (response) {
            if (response.status >= 200 && response.status <= 299) {
                return response.json();
            } else {
                throw Error(response.statusText);
            }
        })
        .then(function (json) {
            // console.log({ json: json });
            if (json.Results == null || json.Results.length == 0) {
                let message = `沒有水位資料!`;
                myAlert(message, "#ff9800");
            } else {
                // 繪製縱剖面圖
                Profile_main("Chart_Hydrograph", path.data[0], projID, true, json);
            }
            indicator1.innerHTML = "";
        }).catch(x => {
            console.log('Error in fetch data message : ', x);
            myAlert("Error in Fetching data!", "red");
        });
}

// --------------------------------------------
// Generate FcstTime array
// 生成觀測/預報時間選項 DEMO

let GenFcstTime = () => {
    // console.log('GenFcstTime() : ');

    // 生成FcstTime for Demo
    function gen_fcstTime(start, n, step) {
        let time = start;
        let fcstTime = [];

        for (let i = 0; i < n; i++) {
            time = start.addMinutes(step * i);
            fcstTime.push(time.yyyymmddhhmmSlash());
            //console.log(time.yyyymmddhhmmSlash());
        }
        return fcstTime;
    }

    let startTime = "2021-09-07 09:10";
    let start = StringToDateTime(startTime);
    let fcstTime = gen_fcstTime(start, 24 * 6, 10);
    let initTime = "2021-09-07 21:00";
    let options = ProfileChart.GenFcstSelect(initTime, fcstTime);
    let fcsttime_select = document.getElementById("FcstTime-Select");
    fcsttime_select.innerHTML = options;
};

// * 觀測/預報選項
// when user change FcstTime-Select 
function FcstTimeChange() {
    let fcsttime = $("#FcstTime-Select").val();
    // console.log({ fcsttime: fcsttime });
    let sel = document.getElementById("FcstTime-Select");
    let text = sel.options[sel.selectedIndex].text;
    // fcsttime title for table2
    document.getElementById("table2-fcsttime").innerHTML = text;
    // Get nodes csv string
    let csv = ProfileChart.GetNodesCSV(path.data[0]);
    // console.log('Nodes CSV : ', csv);

    // * 讀取計算水位
    ReadProfileHeads(csv);
}

// * 專案選項
let project_select = document.getElementById("project-select");
project_select.addEventListener('change', function () {
    let projectId = project_select.value;
    console.log({ projectId: projectId, projectId03: projectId.substr(0, 4) });
    
    // 取得專案預設縱剖面資料
    path = GetPathData(projectId);

    let csv = ProfileChart.GetNodesCSV(path.data[0]);
    ReadProfileHeads(csv);

});


window.onload = function () {
    let value = $("#project-select").val();

    // 取得專案預設縱剖面資料
    path = GetPathData(value);

    // 繪製縱剖面圖，預設為空白水位線
    let head = BlankForDemo();
    Profile_main("Chart_Hydrograph", path.data[0], value, true, head);

    // 生成日期時間選項
    GenFcstTime();

    // 從縱剖面資料取出所有節點，組成CSV
    let csv = ProfileChart.GetNodesCSV(path.data[0]);
    console.log({ csv: csv })

    // 註冊 觀測/預測時間選項
    let sel = document.getElementById("FcstTime-Select");
    sel.addEventListener('change', FcstTimeChange);

    // 選擇專案
    $("#project-select").change(function () {
        // 選擇管網資料、展示縱剖面
        let value = $("#project-select").val();
        myAlert(`專案 :${value}`, BlueColor);

        // 取得專案預設縱剖面資料
        path = GetPathData(value);

        // 繪製縱剖面圖，預設為空白水位線
        let head = BlankForDemo();
        Profile_main("Chart_Hydrograph", path.data[0], value, true, head);
    });
}