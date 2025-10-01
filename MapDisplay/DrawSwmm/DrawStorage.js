// DrawStorage.js
// leaflet
// class version
// 2021-12-03

'use strict'

import { FindNodeCoord } from "../Map2D.js";
import { Base } from "../GetBaseData.js";
import { StorageCurve } from "../Tablejs/StorageCurve.js";

// 繪製滯洪池

export class DrawStorage {

    /**
     * @param {any} map - leaflet 地圖物件
     * @param {{name: string, "x_97": number, "y_97": number, "lng": number, "lat": number}[]} coords - 座標資料
     * @param {any[]} nodes - 滯洪池節點資料
     * @param {any} curves - 曲線資料
     * @param {number} [size] - 繪圖尺寸
     */
    constructor(map, coords, nodes, curves, size) {
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [STORAGE]
        this.nodes = nodes;
        // "STORAGE"
        // 曲線
        this.curves = curves;
        // 預設繪圖的尺寸
        this.size = size || 3;
        // 用於存放已繪製的圖層，方便後續清除
        this.Nodes = [];
        // 查詢用的Marker
        this.Marker;
    }

    /**
     * 根據曲線名稱，從所有曲線資料中篩選出符合的資料。
     * @param {string} curve_name - 曲線名稱
     * @returns {any[]} 包含所有符合曲線資料的陣列
     */
    genStorageCurve(curve_name) {
        // 使用 .filter() 方法來篩選出名稱相符的曲線資料，比 forEach 更為簡潔。
        // 同時預先將 curve_name 轉為大寫，避免在迴圈中重複轉換。
        const upperCurveName = curve_name.toUpperCase();
        return this.curves.filter(curve => curve.Name.toUpperCase() === upperCurveName);
    }

    // 生成滯洪池水深-面積表
    /**
     * 將曲線資料轉換為 HTML 表格的內容 (tr, td)。
     * @param {any[]} array - 曲線資料陣列
     * @returns {string} HTML 表格的 <tr> 字串
     */
    genStorageCurveTable(array) {
        const cols = 3; // 設定每列顯示 3 組「水深-面積」資料
        let tableRowsHtml = [];

        // 遍歷陣列，每次處理一整列（`cols` 個項目）
        for (let i = 0; i < array.length; i += cols) {
            // 從陣列中取出一個區塊 (chunk) 的資料
            const chunk = array.slice(i, i + cols);

            // 將區塊中的每個項目轉換為 <td> HTML 字串
            const cells = chunk.map(item =>
                `<td>${item.X_Value}</td><td>${Number(item.Y_Value).toFixed(0)}</td>`
            );

            // 如果最後一列的資料不足，則用 '-' 補齊
            while (cells.length < cols) {
                cells.push('<td>-</td><td>-</td>');
            }

            // 將儲存格組合成一列 (tr)
            tableRowsHtml.push(`<tr>${cells.join('')}</tr>`);
        }
        return tableRowsHtml.join('');
    }

    // * 生成滯洪池基本資料
    // 輸入 
    //   node : 滯洪池基本資料
    // 回傳
    //   表格
    /**
     * 生成滯洪池基本資料的 HTML 彈出視窗內容，包含資料表格、繪圖按鈕和圖表容器。
     * @param {{ name: string; CurveName: string; Elev: any; Shape: any; InitDepth: any; MaxDepth: any; }} node - 滯洪池的單一節點資料物件
     * @returns {string} 包含滯洪池詳細資料的 HTML 字串
     */
    getNodeTypeString(node) {
        // console.log(node);
        let array = this.genStorageCurve(node.CurveName); // 取得滯洪池水深面積表資料
        let tr = this.genStorageCurveTable(array); // 生成水深面積表的 HTML

        // 為圖表和按鈕產生唯一的 ID
        const chartContainerId = `storage-chart-${node.name}`;
        const drawButtonId = `draw-chart-btn-${node.name}`;

        // 將滯洪池屬性資料格式化為表格
        const propertiesTable = `
            <table class="storage-popup-table">
                <tr><th>節點種類</th><td>STORAGE</td></tr>
                <tr><th>底部高程(m)</th><td>${node.Elev}</td></tr>
                <tr><th>Shape</th><td>${node.Shape}</td></tr>
                <tr><th>初始水深(m)</th><td>${node.InitDepth}</td></tr>
                <tr><th>最大深度(m)</th><td>${node.MaxDepth}</td></tr>
                <tr><th>曲線名稱</th><td>${node.CurveName}</td></tr>
            </table>`;

        // 滯洪池水深面積曲線的表格與繪圖按鈕
        const curveInfo = `
            <p style="margin-top:10px; margin-bottom: 2px;">Depth:水深(m), Area:面積(m^2)</p>
            <table class="table table-bordered table-hover table-sm border-dark">
                <thead>
                    <tr class="bg-blue-100">
                        <th>Depth</th><th>Area</th><th>Depth</th><th>Area</th><th>Depth</th><th>Area</th>
                    </tr>
                </thead>
                <tbody>${tr}</tbody>
            </table>
            <button id="${drawButtonId}" class="btn btn-sm btn-primary mt-1">繪製水深面積圖</button>
            <div id="${chartContainerId}" class="mt-2"></div>`;

        return propertiesTable + curveInfo;
    }

    /**
     * 根據中心點和寬高計算一個矩形邊界框的左下角和右上角座標。
     * @param {number[]} pos - 中心點座標 [lat, lng]
     * @param {number} borderHeight - 高度（公里）
     * @param {number} borderWidth - 寬度（公里）
     * @returns {Array<[number, number]>} 包含左下角和右上角座標的陣列
     */
    CenteredBox(pos, borderHeight, borderWidth) {
        // 寬高單位為公里，1度約等於 110 公里
        let dlng = borderWidth / 110.0; // 將寬度從公里轉換為經度差
        let dlat = borderHeight / 110.0; // 將高度從公里轉換為緯度差
        let corner = []; // 初始化角落座標陣列
        let xleft = pos[0] - dlng / 2;
        let yleft = pos[1] - dlat / 2;
        let xright = pos[0] + dlng / 2;
        let yright = pos[1] + dlat / 2;
        corner.push([xleft, yleft]);
        corner.push([xright, yright]);
        return corner;
    }

    /**
     * 在地圖上加入一個滯洪池圖層。
     * @param {number[]} coord - 中心點座標 [lat, lng]
     * @param {{ name: any; CurveName: string; 
     *           Elev: any; Shape: any; InitDepth: any; 
     *           MaxDepth: any; }} node
     */
    AddStorage(coord, node) {
        try {
            // 驗證輸入的 node 物件是否有效
            if (!node || typeof node !== 'object' || !node.name) {
                console.error("AddStorage: Invalid or incomplete 'node' object provided.", node);
                return;
            }

            // 驗證輸入的 coord 座標是否有效 (-999.9 是 FindNodeCoord 找不到時的回傳值)
            if (!coord || !Array.isArray(coord) || coord.length < 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number' || coord[0] === -999.9) {
                console.warn(`AddStorage: Invalid coordinates for node '${node.name}'. Skipping.`, coord);
                return;
            }

            // 找到進出流管段名稱
            const inf_ouf = Base.get_inf_ouf(node.name);
            const i1 = inf_ouf['inf_links'].length;
            const o1 = inf_ouf['ouf_links'].length;
            const inLinks = inf_ouf['inf_links'].join(', ') || '無';
            const outLinks = inf_ouf['ouf_links'].join(', ') || '無';

            // 使用表格來格式化彈出視窗的內容
            const message = `
                <h6>節點: <strong>${node.name}</strong></h6>
                <style>
                    .storage-popup-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 5px; }
                    .storage-popup-table th, .storage-popup-table td { border: 1px solid #ccc; padding: 3px; text-align: left; }
                    .storage-popup-table th { font-weight: bold; background-color: #f2f2f2; width: 110px;}
                </style>
                <table class="storage-popup-table">
                    <tr><th>座標</th><td>(${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})</td></tr>
                    <tr><th>進流管段(${i1})</th><td>${inLinks}</td></tr>
                    <tr><th>出流管段(${o1})</th><td>${outLinks}</td></tr>
                </table>
                ${this.getNodeTypeString(node)}`;

            // 設定顯示方塊的寬高與顏色
            let boxWidth = 0.003 * this.size;
            let boxHeight = 0.004 * this.size;
            let color = "hsl(" + 200 + ",100%, 50%)";
            // 滯洪池以長方形表示，計算長方形的左下角與右上角座標
            let bounds = this.CenteredBox(coord, boxHeight, boxWidth);

            // 驗證 bounds 是否有效
            if (!bounds || !Array.isArray(bounds) || bounds.length < 2) {
                console.error(`AddStorage: Could not calculate valid bounds for node '${node.name}'.`, { coord, boxHeight, boxWidth });
                return;
            }

            // 建立 Leaflet 長方形圖層
            let rect = L.rectangle(bounds, {
                color: 'black',
                fillColor: color,
                fillOpacity: 0.5,
                weight: 1
            });
            // 綁定說明視窗，設定寬度為560像素
            rect.bindPopup(message, { maxWidth: 560 });

            // 當彈出視窗打開時，為繪圖按鈕加上事件監聽
            rect.on('popupopen', () => {
                const drawButtonId = `draw-chart-btn-${node.name}`;
                const chartContainerId = `storage-chart-${node.name}`;
                const drawButton = document.getElementById(drawButtonId);

                if (drawButton) {
                    drawButton.addEventListener('click', () => {
                        const curveData = this.genStorageCurve(node.CurveName);
                        console.log(curveData)
                        // 使用 StorageCurve 的靜態方法繪製圖表
                        StorageCurve.Draw(curveData, chartContainerId);
                        // 繪製後可以禁用按鈕，避免重複繪製
                        drawButton.disabled = true;
                        drawButton.innerText = '圖表已繪製';
                    });
                }
            });

            // 驗證 map 物件是否存在
            if (this.map && typeof this.map.addLayer === 'function') {
                // 將圖層加到地圖上
                this.map.addLayer(rect);
                // 將圖層儲存於串列，以備刪除使用
                this.Nodes.push(rect);
            } else {
                console.error("AddStorage: Leaflet map object is not valid.");
            }

        } catch (error) {
            // 捕獲任何未預期的錯誤
            console.error(`An error occurred in AddStorage for node '${(node && node.name) || 'unknown'}':`, error);
        }
    }

    /**
     * 繪製所有滯洪池節點。
     */
    Draw() {
        // console.log("Draw Storage : ", this.nodes);
        // 遍歷所有滯洪池資料
        this.nodes.forEach(node => {
            let coord = FindNodeCoord(this.coords, node.name); // 尋找節點座標
            let pt = [coord.lat, coord.lng]; // 取得座標點
            this.AddStorage(pt, node); // 在地圖上加入滯洪池
        });
    }

    /**
     * 清除所有已繪製的滯洪池圖層。
     */
    Clear() {
        // 使用 forEach 遍歷所有已繪製的圖層並從地圖上移除，
        // 然後清空圖層陣列。這樣比傳統的 for 迴圈和 if 判斷更簡潔。
        this.Nodes.forEach(node => this.map.removeLayer(node));
        this.Nodes = [];
    }
}