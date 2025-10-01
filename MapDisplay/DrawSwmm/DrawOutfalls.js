// DrawOutfalls.js
// leaflet
// class version
// 2021-12-03

'use strict'

import { FindNodeCoord } from "../Map2D.js";
import { Base } from "../GetBaseData.js";


/**
 * 繪製 SWMM 的出水口 (Outfalls) 到 Leaflet 地圖上。
 * 使用紅色的倒三角形符號來表示出水口。
 */
export class DrawOutfalls {
    /**
     * @param {L.Map} map Leaflet 地圖實例。
     * @param {Array<object>} coords 包含節點座標的陣列 ([COORDINATES])。
     * @param {Array<object>} nodes 包含出水口節點資料的陣列 ([OUTFALLS])。
     * @param {any} curves 曲線資料 (目前未使用)。
     */
    constructor(map, coords, nodes, curves) {
        /** @type {L.Map} Leaflet 地圖實例 */
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [OUTFALLS]
        this.nodes = nodes;
        // "OUTFALLS"
        // 曲線
        this.curves = curves;
        /** @type {Array<L.Layer>} 用於存放已繪製的出水口圖層，方便後續清除 */
        this.Nodes = [];
        // 查詢用的Marker
        this.Marker;
    }

    // * get outfall data string

    /**
     * 產生出水口節點的屬性字串，用於彈出視窗(Popup)顯示。
     * @param {{ Elevation: any; Type: any; Gated: any; }} node - 單一出水口節點物件。
     * @param {string} type - 節點類型字串 (例如 "OUTFALLS")。
     * @returns {string} HTML 格式的屬性字串。
     */
    getNodeTypeString(node, type) {
        let s = `節點種類：${type}<br>
                高程：${node.Elevation}(m)<br>
                型態：${node.Type}<br>
                閘門：${node.Gated}`;
        return s;
    }

    /**
     * 計算用於表示出水口的倒三角形的三個頂點座標，並以指定座標為中心點。
     * @param {number[]} pos - 中心點座標 [lat, lng]。
     * @param {number} Width - 三角形的寬度 (單位：公里)。
     * @returns {Array<[number, number]>} 三角形的三個頂點座標陣列。
     */
    TrianglePos(pos, Width) {
        const dlng = Width / 110.0; // 將公里寬度約略轉換為度
        const height = dlng / 2; // 根據寬度定義高度，維持形狀
        const width = dlng;

        // 倒三角形的質心(centroid)位於從頂部底邊向下 1/3 高度處。
        // 為了將三角形中心對齊 pos，我們需要調整頂點的 y 座標。
        const yBase = pos[0] + height / 3; // 三角形的頂部底邊 y 座標
        const yApex = pos[0] - (height * 2) / 3; // 三角形底部頂點的 y 座標

        const xLeft = pos[1] - width / 2; // 左頂點 x 座標
        const xRight = pos[1] + width / 2; // 右頂點 x 座標

        const corner = [];
        corner.push([yBase, xLeft]);   // 左上頂點
        corner.push([yBase, xRight]);  // 右上頂點
        corner.push([yApex, pos[1]]);  // 底部頂點
        return corner;

    }

    /**
     * 在地圖上新增一個三角形圖層來表示出水口。
     * @param {number[]} pos - 中心點座標 [lat, lng]。
     * @param {string} message - 綁定到三角形上的彈出訊息 (HTML 格式)。
     * @param {string} [color='red'] - 三角形的顏色，預設為紅色。
     */
    addTriangle(pos, message, color = 'red') {
        let trianglePos = this.TrianglePos(pos, 0.03);
        let tri = L.polygon(trianglePos, {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            weight: 1
        });
        tri.bindPopup(message);
        this.map.addLayer(tri);
        this.Nodes.push(tri);
    }

    /**
     * 處理單一出水口的繪製，包括組合資訊字串與呼叫繪製三角形的函式。
     * @param {number[]} coord - 出水口的座標 [lat, lng]。
     * @param {{ name: any; Elevation: any; Type: any; Gated: any; }} node - 單一出水口節點物件。
     */
    AddOutfalls(coord, node) {
        // 找到進出流管段名稱
        const inf_ouf = Base.get_inf_ouf(node.name);
        const i1 = inf_ouf['inf_links'].length;
        const o1 = inf_ouf['ouf_links'].length;
        const inLinks = inf_ouf['inf_links'].join(', ') || '無';
        const outLinks = inf_ouf['ouf_links'].join(', ') || '無';

        // 使用表格來格式化彈出視窗的內容
        const message = `
            <h6>節點：<strong>${node.name}</strong></h6>
            <style>
                .leaflet-popup-table { border-collapse: collapse; width: 100%; font-size: 12px; }
                .leaflet-popup-table th, .leaflet-popup-table td { border: 1px solid #ccc; padding: 3px; text-align: left; }
                .leaflet-popup-table th { font-weight: bold; background-color: #f2f2f2; }
            </style>
            <table class="leaflet-popup-table">
                <tr><th>座標</th><td>(${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})</td></tr>
                <tr><th>節點種類</th><td>OUTFALLS</td></tr>
                <tr><th>高程(m)</th><td>${node.Elevation}</td></tr>
                <tr><th>型態</th><td>${node.Type}</td></tr>
                <tr><th>閘門</th><td>${node.Gated}</td></tr>
                <tr><th>進流管段(${i1})</th><td>${inLinks}</td></tr>
                <tr><th>出流管段(${o1})</th><td>${outLinks}</td></tr>
            </table>`;
        this.addTriangle(coord, message, 'red');
    }

    /**
     * 迭代所有出水口節點資料，並將它們繪製到地圖上。
     */
    Draw() {
        // console.log({ Outfalls: this.nodes });
        // console.log({ curves: this.curves });
        this.nodes.forEach(node => {
            let coord = FindNodeCoord(this.coords, node.name);
            // console.log(node.name)
            let pt = [coord.lat, coord.lng];
            this.AddOutfalls(pt, node);
        });
    }

    /**
     * 清除所有由這個類別實例繪製的出水口圖層。
     */
    Clear() {
        if (this.Nodes != undefined && this.Nodes.length > 0) {
            for (let i = 0; i < this.Nodes.length; i++) {
                this.map.removeLayer(this.Nodes[i]);
            }
            this.Nodes = [];
        }

    }
}