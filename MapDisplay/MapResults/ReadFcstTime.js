// ReadFcstTime.js
// 2023-09-04
// 取得預報日期時間串列

import { myAlert } from '../myAlert.js';
import { BaseUrl } from '../../Common/BaseURL.js';
import { MyUtils } from '../js/MyUtils.js';

let FcstTime_el = document.getElementById("FcstTime");

export let FcstTimeList;


function GenFcstTimeOptions() {
    let opts = "";
    if (FcstTimeList === undefined) return "<option>無資料</option>";
    for (let i = 0; i < FcstTimeList.FcstTime.length; i++) {
        opts += `<option>${FcstTimeList.FcstTime[i]}</option>`;
    }
    return opts;
}

// http://localhost:5000/v1/MapSwmmResult/GetFcstTime?ProjectId=TY_DMCREEK&InitTime=2023-08-10%2016%3A50
/** *未使用!!!
 * 讀取預報日期時間
 */
export function ReadFcstTime() {
    
    let timeout = 30 * 1000; // milliseconds
    let projectId = document.getElementById("project-select").value;
    let InitTime = document.getElementById("InitTime").value;

    let URL = `${BaseUrl}/v1/MapSwmmResult/GetFcstTime?ProjectId=${projectId}&InitTime=${InitTime}`;
    console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;

    $.ajax({
        type: "GET",
        url: URL,
        dataType: 'json',
        async: true,
        success: function (json) {
            console.log(json);
            FcstTimeList = json;
            // start draw path on map
            if (json === null || json.length == 0) {
                myAlert(`API預報日期時間!`, "red");
                return;
            }
            let opts = GenFcstTimeOptions();
            FcstTime_el.innerHTML = opts;
        },
        error: function (xhr, status, errorThrow) {
            console.log("Error : " + errorThrow);
            // console.log("Status : " + status);
            // console.log(xhr);
            myAlert(`Error :${errorThrow}，時間限制 :${timeout}`, "red");
        },
        complete: function () {
            indicator.innerText = "";

        },
        timeout: timeout
    }).done(function (json) {
    });
}

/*
  export interface Root {
  ProjectID: string
  InitTime: string
  FcstTime: string[]
  Message: string
}
*/

/** 生成預報日期時間選項 
 * bkHours : 回溯時數
 * leadHours : 領先時數
 * timeInterval : 時間間隔, 分鐘, ex. 10
 * return with <option></option>
*/
export function GetFcstTimeV2(bkHours, leadHours, timeInterval){

    // bkHours = bkHours | 12;
    // leadHours = leadHours | 12;
    // timeInterval = timeInterval | 10;

    if (Number(timeInterval) > 30 || Number(timeInterval) <= 1){
        console.error(`GetFcstTimeV2(), timeInterval 必須小於30且大於1!`)
        FcstTime_el.innerHTML = "<option>無資料</option>";
        return;
    }

    let InitTimeString = document.getElementById("InitTime").value;
    let InitTime = MyUtils.StringToDateTime(InitTimeString);
    let startDate = MyUtils.addHours(InitTime, -bkHours);
    let totalHours = bkHours + leadHours;
    // 十分鐘間隔
    let total10Mins = totalHours * 60 / timeInterval;

    let opts = "";
    for (let i = 1; i < total10Mins - 1; i++){
        let date = MyUtils.addMinutes(startDate, i * timeInterval);
        let s = MyUtils.DateToYYYYMMDDHHMM_Dash(date);
        opts += `<option>${s}</option>`;
    }
    FcstTime_el.innerHTML = opts;
    // 設定為預報產製日期時間
    FcstTime_el.value = InitTimeString;
    return;
}