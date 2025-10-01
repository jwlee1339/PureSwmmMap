// ReadProjectNames.js
// for Swmm_Profile.js
// 2021-12-23



// API位址
import { BaseUrl } from './BaseURL.js';
import { myAlert, RedColor, GreenColor } from './myAlert.js';
import { Ajax } from './FetchTimeOut.js';

export var ProjectNames = {}

/**
 * @param {{ length?: any; projDesc?: any; }} json
 * @param {string} DomId
 */
function GenProjectNamesSelect(json, DomId) {
    if (json === undefined || json.length === 0) {
        console.log('沒有專案資料!')
        return;
    }
    let project_select = document.getElementById(DomId);
    let projDesc = json.projDesc;
    if (projDesc === undefined || projDesc.length === 0) {
        console.log('沒有專案資料!')
        return;

    }
    // 過濾
    var a = projDesc.filter((/** @type {{ projId: string; }} */ x) =>
        x.projId === "KEELUNG" || x.projId.substring(0, 7) === "SHAPUTH" ||
        x.projId.substring(0, 5) === "TY_DM"
    );

    console.log({ a })

    // 產生專案選項
    let options = "";
    for (let i = 0; i < a.length; i++) {
        if ((a[i].firstPeakReduce) !== "-9999")
            options += `<option value='${a[i].projId}'>${a[i].projId}</option>`;
    }
    project_select.innerHTML = options;
    // console.log({a});
}


// Fetch with time out
// 取得專案名稱
// ENTRY
// DomId : HTML的 DOM id, ex. "project-select"
// test OK at 2021-12-31

export async function GetProjectNamesFromServer(DomId, timeout) {
    if (DomId === undefined || DomId.length === 0) {
        console.log('GetProjectNamesFromServer(DomId), 請先指定DomId!');
        return null;
    }

    ProjectNames = {
        "projDesc": [
            {
                "projId": "TY_DMCREEK",
                "description": "桃園市東門溪流域",
                "swmminp": "TY_DMCREEK",
                "memo": "東門溪流域(2023年)"
            }
        ]
    };
    GenProjectNamesSelect(ProjectNames, DomId);

    return;

    timeout = timeout || 3000; // milliseconds

    // http://61.219.21.106:8089/SwmmDemo/GetProjectDescriptions
    // http://localhost:5000/v1/SWMM_results/Projects -> not yet

    let URL = `${BaseUrl}/SwmmDemo/GetProjectDescriptions`;

    console.log(URL);


    let indicator = document.getElementById("Load-indicator1");
    indicator.innerText = `讀取中...`;
    const json = await Ajax(URL, {}, timeout);
    if (json !== undefined) {
        console.log(json);
        ProjectNames = json;
        console.log("讀取專案名稱OK!");
        GenProjectNamesSelect(ProjectNames, DomId);
    } else {
        myAlert(`Error :時間限制 :${timeout}`, RedColor);
    }
    indicator.innerText = "";
}


/*
{
"projDesc":[
      {
        "projid": "TY_DMCREEK",
        "description": "桃園市東門溪流域",
        "swmminp": "TY_DMCREEK",
        "memo": "東門溪流域(2023年)"
      },
      {
        "projid": "TYYU_C0C700",
        "description": "完工後",
        "swmminp": "yu_jwlee.inp",
        "memo": "漁管處滯洪池完工後狀態"
      },
        {
            "projId": "KEELUNG",
            "description": "2023-11-13",
            "swmminp": "keelung.inp",
            "memo": "基隆市雨水下水道"
        }
]
}
*/