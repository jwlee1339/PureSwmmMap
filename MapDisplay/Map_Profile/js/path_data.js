// GetPathData.js
// 2021-12-21

import { tyyu_demo_0_path } from "../../PathData/TYYU_DEMO_0_path.js";
import { tyyu_demo_a_path } from "../../PathData/TYYU_DEMO_A_path.js";
import { tyyu_demo_b_path } from "../../PathData/TYYU_DEMO_B_path.js";
import { tyyu_demo_c_path } from "../../PathData/TYYU_DEMO_C_path.js";
import { rende_det_path } from "../../PathData/RENDE_DET_path.js";
import { cl_path } from "../../PathData/cl_path.js";
import { yc_path } from "../../PathData/yc_path.js";
import { madou_path } from "../../PathData/madou_path.js";
import { Dawan_1211_path } from "../../PathData/Dawan_1211_path.js";
import { Lungten_path } from "../../PathData/Lungten_path.js";
import { Baochu_path } from "../../PathData/Baochu_path.js";


export var GetPathData = function(value){
    let path = {};
    if (value === "TYYU_DEMO_A") {
        path.data = tyyu_demo_a_path;
    }
    else if (value === "TYYU_DEMO_B") {
        path.data = tyyu_demo_b_path;
    }
    else if (value === "TYYU_DEMO_C") {
        path.data = tyyu_demo_c_path;
    }
    else if (value === "TYYU_DEMO_0") {
        path.data = tyyu_demo_0_path;
    }
    else if (value === "RENDE-DET") {
        path.data = rende_det_path;
    }
    else if (value === "中路重劃區v2") {
        path.data = cl_path;
    }
    else if (value === "右昌") {
        path.data = yc_path;
    }
    else if (value === "寶珠溝") {
        path.data = Baochu_path;
    }
    else if (value === "Madou20180701") {
        path.data = madou_path;
    }
    else if (value === "1211") {
        path.data = Dawan_1211_path;
    }
    else if (value === "龍潭v1") {
        path.data = Lungten_path;
    }
    else {
        alert("沒有這個專案! 專案:", value);
    }

    return path;
}