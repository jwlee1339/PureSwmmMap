// Hydraulics.js
// 2024-11-07
// 計算流量

import { Base } from "../GetBaseData.js";
import { ABPTable } from "./ABPTable.js";

/**
 * @typedef {object} XSection 描述一個管段的斷面資料。
 * @property {string} Shape - 斷面形狀，例如 'RECT_CLOSED', 'CIRCULAR', 'TRAPEZOIDAL', 'IRREGULAR'。
 * @property {string | number} Geom1 - 幾何參數1 (例如：高度、直徑、不規則斷面ID)。
 * @property {number} Geom2 - 幾何參數2 (例如：寬度)。
 * @property {number} Geom3 - 幾何參數3 (例如：左邊坡)。
 * @property {number} Geom4 - 幾何參數4 (例如：右邊坡)。
 * @property {number} [Barrels] - 管數 (可選)。
 */

/**
 * 取得渠道高度(M)。
 * @param {XSection} xsection - 管段斷面資料。
 * @returns {number | null} 渠道高度(M)，如果無法計算則返回 null。
 */
export function GetChannelHeight(xsection) {
    // xsection.Shape = ['RECT_CLOSED', 'CIRCULAR', 'RECT_OPEN', 'TRAPEZOIDAL']
    if (xsection === undefined) {
        console.warn("GetChannelHeight(), 缺少xsection資料!")
        return null;
    }
    // 矩形斷面
    if (xsection.Shape === 'RECT_CLOSED' || xsection.Shape === 'RECT_OPEN') {
        return Number(xsection.Geom1);
    }
    // 圓形斷面
    else if (xsection.Shape === 'CIRCULAR') {
        return Number(xsection.Geom1);
    }
    // 梯形斷面
    else if (xsection.Shape === 'TRAPEZOIDAL') {
        // Max. Height, Width, Left Slope, Right Slope
        return Number(xsection.Geom1);
    }
    // 不規則斷面管渠
    if (xsection.Shape === "IRREGULAR") {
        console.warn(`不規則斷面管渠, xsection.Shape=${xsection.Shape}`);
        // 取得斷面XY
        let Name = xsection.Geom1.toUpperCase();
        let abp_table = new ABPTable(Base.data.TRANSECTS);
        let XY = abp_table.findSectXY(Name);
        //-----計算渠道最大高度
        if (XY.Y === undefined || XY.Y === null) return null;
        try {
            let lowEL = ABPTable.Find_Lowest(XY.Y );
            let highEL = ABPTable.Find_high(XY.Y );
            let height = highEL.maxY - lowEL.LowestEL;
            //console.log(lowEL, highEL);
            return height;
        }
        catch (e) {
            console.log("IRREGULAR, e=", e);
            return null;
        }
    }
    else
        return null;
}

/**
 * 計算斷面通水面積 (M^2)。
 * @param {XSection} xsection - 管段斷面資料。
 * @param {number} depth - 水深(M)。
 * @returns {number | null} 通水面積 (M^2)，如果無法計算則返回 null。
 */
export function GetChannelFlowArea(xsection, depth) {
    if (xsection === undefined) {
        console.warn("GetChannelFlowArea(), 缺少xsection資料!")
        return null;
    }
    if (+depth < +0.0) {
        console.warn("GetChannelFlowArea(), 水深必須大於0!");
        return null;
    }
    let flow_area = +0;
    // 計算通水面積
    // 矩形斷面
    if (xsection.Shape === 'RECT_CLOSED' || xsection.Shape === 'RECT_OPEN') {
        flow_area = +depth * Number(xsection.Geom2);
        if (+xsection.Barrels > 1)
            flow_area *= +xsection.Barrels;
        return flow_area;
    }
    // 圓形斷面
    else if (xsection.Shape === 'CIRCULAR') {
        // 以水深計算夾角
        // 設定圓形管道的直徑和水深
        let diameter = Number(xsection.Geom1);
        // 計算半徑
        let radius = diameter / 2.0;
        // 計算圓弧半角（以弧度表示）
        let theta = Math.acos((radius - depth) / radius);
        // 計算通水面積 
        flow_area = radius * radius * (theta - Math.sin(2 * theta) / 2.0);
        
        if (+xsection.Barrels > 1)
            flow_area *= +xsection.Barrels;
        //console.log(flow_area, 'Barrels=',xsection.Barrels)
        // 計算面積
        return flow_area;
    }
    // 梯形斷面
    else if (xsection.Shape === 'TRAPEZOIDAL') {
        // Max. Height, Width, Left Slope, Right Slope
        // 計算左側水面寬
        let left_w = +depth * Number(xsection.Geom3);
        let right_w = +depth * Number(xsection.Geom4);
        // 底寬
        let b = +xsection.Geom2;
        // 水面寬度
        let top_width = b + left_w + right_w;
        // 梯形面積
        flow_area = (top_width + b) * +depth / 2.0;
        if (+xsection.Barrels > 1)
            flow_area *= +xsection.Barrels;
        return flow_area;
    }
    // 不規則斷面管渠
    if (xsection.Shape === "IRREGULAR") {
        // console.warn(`不規則斷面管渠, xsection.Shape=${xsection.Shape}`);
        // todo 取得斷面資料XY
        let Name = xsection.Geom1.toUpperCase();
        let abp_table = new ABPTable(Base.data.TRANSECTS);
        let XY = abp_table.findSectXY(Name);
        // console.log('Name=',Name, XY)
        if (XY.Y === undefined || XY.Y === null) return null;
        try {
            let low = ABPTable.Find_Lowest(XY.Y ).LowestEL;
            let WEL = depth + low;
            let res = ABPTable.CalABP(XY.X, XY.Y, WEL);
            // console.log("*", depth, low, WEL, res)
            return res.a;
        }
        catch (e) {
            console.log("IRREGULAR, e=", e);
            return null;
        }
    }
    else
        return null;
}

/**
 * 計算水力半徑(M)。
 * @param {XSection} xsection - 管段斷面資料。
 * @param {number} depth - 水深(M)。
 * @returns {number | null} 水力半徑(M)，如果無法計算則返回 null。
 */
export function GetHydraulicRadius(xsection, depth) {
    if (xsection === undefined) {
        console.warn("GetChannelFlowArea(), 缺少xsection資料!")
        return null;
    }
    if (+depth <= +0.0) {
        console.warn("GetChannelFlowArea(), 水深必須大於0!");
        return null;
    }
    let hydraulicRadius = 0.0;
    // R = Flow Area/ Perimeter
    if (xsection.Shape === 'RECT_CLOSED' || xsection.Shape === 'RECT_OPEN') {
        // Flow area
        let A = GetChannelFlowArea(xsection, depth);
        // Perimeter
        let P = Number(xsection.Geom2) + 2.0 * depth;
        hydraulicRadius = A / P;
        return hydraulicRadius;
    }
    // 圓形斷面
    else if (xsection.Shape === 'CIRCULAR') {
        // Given parameters 
        let diameter = Number(xsection.Geom1);
        // Calculating radius of the pipe 
        let R = diameter / 2.0;
        // Calculating central angle (theta) in radians 
        let theta = 2 * Math.acos((R - depth) / R);
        // Calculating wetted perimeter 
        let P = R * theta;
        // Calculating cross-sectional area of flow 
        let A = (R * R * (theta - Math.sin(theta))) / 2.0;
        // Calculating hydraulic radius 
        let hydraulicRadius = A / P;
        return hydraulicRadius;
    }
    // 梯形斷面
    else if (xsection.Shape === 'TRAPEZOIDAL') {
        let left_w = +depth * Number(xsection.Geom3);
        let right_w = +depth * Number(xsection.Geom4);
        // 底寬
        let b = +xsection.Geom2;
        // 水面寬度
        let top_width = b + left_w + right_w;
        // perimeter
        let P = b + 2 * Math.sqrt((Math.pow((top_width - b) / 2), 2) + Math.pow(depth, 2));
        let A = GetChannelFlowArea(xsection, depth);
        hydraulicRadius = A / P;
        return hydraulicRadius;
    }
    // 不規則斷面管渠
    if (xsection.Shape === "IRREGULAR") {
        // console.warn(`不規則斷面管渠, xsection.Shape=${xsection.Shape}`);
        // todo 取得斷面XY
        let Name = xsection.Geom1.toUpperCase();
        let abp_table = new ABPTable(Base.data.TRANSECTS);
        let XY = abp_table.findSectXY(Name);
        if (XY.Y === undefined || XY.Y === null) return null;
        try {
            let WEL = depth + ABPTable.Find_Lowest(XY.Y).LowestEL;
            let res = ABPTable.CalABP(XY.X, XY.Y, WEL);
            let hydraulicRadius = res.a / res.p;
            // console.log(WEL, res)
            return hydraulicRadius;
        }
        catch (e) {
            console.log("IRREGULAR, e=", e);
            return null;
        }
    }
    else {
        console.warn("沒有這個斷面:xsection.Shape=", xsection.Shape);
        return null;
    }
}
