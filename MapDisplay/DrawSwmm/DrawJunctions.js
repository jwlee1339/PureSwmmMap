// DrawNodes.js
// leaflet
// class version
// 2021-11-14


'use strict'

import { FindNodeCoord } from "../Map2D.js";
import { FindNodeValue } from "../MapResults/ReadMapRes.js";
import { GREENCOLOR, ORANGECOLOR, REDCOLOR } from "../myAlert.js";
import { Base } from "../GetBaseData.js";

/**
 * 繪製 SWMM 的人孔/節點 (Junctions) 到 Leaflet 地圖上。
 * 節點會以圓圈表示，並根據溢流情況顯示不同顏色。
 */
export class DrawJunctions {
    /**
     * @param {L.Map} map Leaflet 地圖實例。
     * @param {Array<object>} coords 包含節點座標的陣列 ([COORDINATES])。
     * @param {Array<object>} nodes 包含人孔節點資料的陣列 ([JUNCTIONS])。
     * @param {object} MapFcstRes SWMM 的完整預報結果物件。
     * @param {number} [radius=3] 節點圓圈的半徑（單位：像素）。
     */
    constructor(map, coords, nodes, MapFcstRes, radius) {
        /** @type {L.Map} Leaflet 地圖實例 */
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [JUNCTIONS]
        this.nodes = nodes;

        // SWMM所有預報結果, see ReadMapRes.js
        this.MapFcstRes = MapFcstRes;

        // "JUNCTIONS"
        // 節點圓半徑
        this.radius = radius || 3;  // 預設為px
        /** @type {Array<L.Layer>} 用於存放已繪製的節點圖層，方便後續清除 */
        this.Nodes = [];
        // 查詢用的Marker
        this.Marker;
    }

    /**
     * 在主控台顯示節點名稱 (用於除錯)。
     * @param {string} node_name - 要顯示的節點名稱。
     */
    show(node_name) {
        console.log("Node Name:", node_name);
    }

    /**
     * 根據溢流量決定節點顏色。
     * @param {number} flood - 溢流量 (CMS)。
     * @returns {string} 代表顏色的十六進位碼。
     */
    NodeColorByFlood(flood) {
        if (Number(flood) > +0.02) return REDCOLOR;
        if (Number(flood) > +0.001) return ORANGECOLOR;
        return GREENCOLOR;
    }

    /**
     * 產生 SWMM 節點預報結果的 HTML 表格。
     * @param {{Id: string, Head: number, Flow: number, Flood: number}} NodeRes - 單一節點的計算結果。
     * @returns {string} HTML 格式的結果表格字串。
     */
    GenNodeResTable(NodeRes) {
        const { Head, Flow, Flood } = NodeRes;
        const tr = `<tr><td>${Head.toFixed(2)}</td><td>${Flow.toFixed(2)}</td><td>${Flood.toFixed(2)}</td></tr>`;

        // 使用內嵌 <style> 標籤來確保表格樣式正確，不依賴外部 CSS 框架。
        const tableHTML = `
            <strong>預報產製: ${this.MapFcstRes.InitTime}</strong><br>
            <strong>預報時間: ${this.MapFcstRes.FcstTime}</strong>
            <style>
                .swmm-junction-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 5px; }
                .swmm-junction-table th, .swmm-junction-table td { border: 1px solid #999; padding: 4px; text-align: center; }
                .swmm-junction-table th { font-weight: bold; background-color: #e0e8f0; color: #333; }
            </style>
            <table class="swmm-junction-table">
                <thead>
                    <tr>
                        <th>水位(M)</th>
                        <th>流量(CMS)</th>
                        <th>溢流(CMS)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tr}
                </tbody>
            </table>`;
        return tableHTML;
    }

    // 圓形
    // pos : 座標，例如 [24.978183645203302, 121.2640713998359];
    // zoomLevel : 16, circle radius = 10
    //             17,
    /**
     * 在地圖上新增一個圓形圖層來表示節點。
     * @param {number[]} pos - 中心點座標 [lat, lng]。
     * @param {string} message - 綁定到圓形上的彈出訊息 (HTML 格式)。
     * @param {number} [flood] - 溢流量，用於決定顏色。
     */
    addCircle(pos, message, flood) {
        let color = GREENCOLOR;
        if (flood !== undefined) {
            color = this.NodeColorByFlood(flood);
        }

        var circle;
        if (color === GREENCOLOR)
            circle = L.circle(pos, {
                color: color,
                fill: true,
                fillOpacity: 0.8,
                weight: 1,
                radius: this.radius
            });
        else
            circle = L.circle(pos, {
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 1,
                radius: this.radius
            });

        circle.bindPopup(message);

        this.map.addLayer(circle);
        this.Nodes.push(circle);
    }

    // AddJunction

    /**
     * 處理單一人孔的繪製，包括組合資訊字串與呼叫繪製圓形的函式。
     * @param {number[]} coord - 人孔的座標 [lat, lng]。
     * @param {{name: string, Elevation: number, MaxDepth: number}} node - 單一人孔節點物件。
     */
    AddJunction(coord, node) {
        const node_value = FindNodeValue(node.name);

        // 找到進出流管段名稱
        const inf_ouf = Base.get_inf_ouf(node.name);
        const i1 = inf_ouf['inf_links'].length;
        const o1 = inf_ouf['ouf_links'].length;
        const inLinks = inf_ouf['inf_links'].join(', ') || '無';
        const outLinks = inf_ouf['ouf_links'].join(', ') || '無';

        let resultsHTML = '';
        if (node_value && node_value.Head !== undefined) {
            resultsHTML = this.GenNodeResTable(node_value);
        } else {
            resultsHTML = '<strong>無計算結果</strong>';
        }

        const message = `
            <h6>節點: <strong>${node.name}</strong></h6>
            ${resultsHTML}
            <style>
                .swmm-junction-props-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 5px; }
                .swmm-junction-props-table th, .swmm-junction-props-table td { border: 1px solid #ccc; padding: 3px; text-align: left; }
                .swmm-junction-props-table th { font-weight: bold; background-color: #f2f2f2; width: 100px; }
            </style>
            <table class="swmm-junction-props-table">
                <tr><th>座標</th><td>(${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})</td></tr>
                <tr><th>節點種類</th><td>JUNCTION</td></tr>
                <tr><th>底部高程(m)</th><td>${node.Elevation}</td></tr>
                <tr><th>最大深度(m)</th><td>${node.MaxDepth}</td></tr>
                <tr><th>進流管段(${i1})</th><td>${inLinks}</td></tr>
                <tr><th>出流管段(${o1})</th><td>${outLinks}</td></tr>
            </table>
        `;

        this.addCircle(coord, message, node_value ? node_value.Flood : undefined);
    }

    // Draw Nodes
    /**
     * 迭代所有節點資料，並將它們繪製到地圖上。
     */
    Draw() {
        // console.log("Draw Nodes: ", this.nodes);
        this.nodes.forEach(node => {
            let coord = FindNodeCoord(this.coords, node.name);
            // console.log(node.name)
            let pt = [coord.lat, coord.lng];
            this.AddJunction(pt, node);
        });
    }

    // 清除節點
    /**
     * 清除所有由這個類別實例繪製的節點圖層。
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