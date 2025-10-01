// ReadAreaBorder.js
// 2023-08-11
// 讀取東門溪流域邊界polygon

import { myAlert, BLUECOLOR, REDCOLOR, ORANGECOLOR, GREENCOLOR } from "../myAlert.js";

// 子集水區邊界資料 例如:DMBorder.json
export let AreaBorder;

// 繪圖類別
export let drawAreaBorder;



/**
 * 讀取子集水區邊界座標點
 */
export function ReadAreaBorder() {

    let URL = `./SwmmMap/MapDisplay/Data/DMBorder.json`;
    console.log({ URL });

    $.ajax({
        url: URL,
        data: {},
        type: "GET",
        dataType: "json",
        async: false,
        success: (json) => {
            console.log(json);
            AreaBorder = json;

            //if (drawAreaBorder !== undefined) drawAreaBorder.Clear();

            //// 繪製所有子集水區邊界
            //drawAreaBorder = new DrawAreaBorder(map, AreaBorder, null);
            //drawAreaBorder.plot(0);

        },
        error: (xhr, status, errorThrow) => {
            console.error("連線過久或讀取資料發生錯誤!", errorThrow);
            myAlert("讀取邊界線，發生錯誤!", REDCOLOR);
            // 無資料時 設定為null
            AreaBorder = null;
        },
        complete: function () {
            // ShowSubArea1(map, GlobalAreaName);
            myAlert("成功讀取邊界線", GREENCOLOR);
        },
        timeout: 10000, // 10 seconds
    });
}