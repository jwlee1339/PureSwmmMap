// DrawPaths.js
// D:\home\1_崇峻\SwmmWebview2V2\Work\PureSwmmMap\SwmmMap\MapDisplay\DrawSwmm\DrawPath.js
// leaflet map，套繪最短路徑圖
// class version
// 2021-11-16


/**
 * 代表計算路徑中的一個管段。
 * @typedef {object} PathLink
 * @property {string} ID - 管段的唯一識別碼。
 * @property {string} Type - 管段的類型 (例如 "CONDUIT")。
 * @property {boolean} Marked - 一個布林標記，指出此管段是否被標記。
 * @property {string} FromNode - 管段起點的節點 ID。
 * @property {string} ToNode - 管段終點的節點 ID。
 * @property {number} Length - 管段的長度。
 * @property {number} Height - 管段的高度。
 * @property {number} InOffset - 入口偏移量。
 * @property {number} OutOffset - 出口偏移量。
 */

/**
 * 代表計算路徑中的一個節點。
 * @typedef {object} PathNode
 * @property {string} ID - 節點的唯一識別碼。
 * @property {string} type - 節點的類型 (例如 "JUNCTION", "OUTFALL")。
 * @property {number} Invert - 節點的管底高程。
 * @property {number} MaxDepth - 節點的最大深度。
 * @property {string[]} aLink - 連接到此節點的管段 ID 陣列。
 * @property {number} PathLength - 從起始節點到此節點的路徑長度。
 * @property {number} TopElevation - 節點的頂部高程。
 */

/**
 * 代表由 DFS (深度優先搜尋) 演算法找到的路徑。
 * @typedef {object} DFSPath
 * @property {string} Version - DFS 搜尋演算法的版本。
 * @property {string} ProjectId - 專案的 ID。
 * @property {string} SWMMInpFile - SWMM 輸入檔的路徑。
 * @property {string} StartNode - 路徑搜尋的起始節點 ID。
 * @property {string} EndNode - 路徑搜尋的結束節點 ID。
 * @property {string} PublishDate - 路徑發布的日期和時間。
 * @property {string[]} LinkIds - 組成路徑的管段 ID 陣列。
 * @property {string[]} NodeIds - 組成路徑的節點 ID 陣列。
 * @property {PathNode[]} PNodes - 路徑中詳細的節點物件陣列。
 * @property {PathLink[]} PLinks - 路徑中詳細的管段物件陣列。
 * @property {string} Message - 狀態訊息 (例如 "OK")。
 */


import { FindNodesOfLink, FindNodeCoord, FindVerticesOnLink, VioletIcon, GreenIcon } from "../Map2D.js";

// 生成跳出視窗，展示路徑資料及將路徑節點存入資料庫[按鈕]
import { InsertPathDiv } from "./Component/InsertPathDiv.js";

// input variables :
// SwmmMap, rende_det_path, data.COORDINATES, data.CONDUITS, data.VERTICES
let User_NodeCSV = "";

export class DrawPath {

    /**
     * 建立一個 DrawPath 實例。
     * @param {L.Map} map - Leaflet 地圖物件。
     * @param {DFSPath} path - 要繪製的路徑資料。
     * @param {any} coords - 座標資料。
     * @param {any} conduits - 管渠資料。
     * @param {any} weirs - 堰資料。
     * @param {any} orifices - 孔口資料。
     * @param {any} pumps - 抽水站資料。
     * @param {any} vertices - 管線頂點資料。
     */
    constructor(map, path, coords, conduits, weirs, orifices, pumps, vertices) {
        this.map = map;
        this.path = path;
        this.coords = coords;
        this.conduits = conduits;
        this.weirs = weirs;
        this.orifices = orifices;
        this.pumps = pumps;
        this.vertices = vertices;
        // 儲存leaflet物件，清除用
        this.Conduits = [];
        // 儲存markers
        this.Markers = [];
        // 路徑總長度
        this.TotalPathLength = 0.0;
        // 加上所有節點CSV
        this.nodeCSV = this.path.NodeIds;
        // 將不同類型的管線來源存儲在一個物件中，以便快速查找
        this.linkSources = {
            'CONDUIT': this.conduits,
            'WEIR': this.weirs,
            'ORIFICE': this.orifices,
            'PUMP': this.pumps
        };
    }

    /**
     * 根據起點、終點和中間點產生一個 polyline 的座標陣列。
     * @param {{ lat: number; lng: number; }} FromPoint - 管渠起點座標。
     * @param {{ lat: number; lng: number; }} ToPoint - 管渠終點座標。
     * @param {{lat: number, lng: number}[]} verticesPoints - 管渠中間點座標陣列。
     * @returns {number[][]} 用於 Leaflet polyline 的 latlngs 陣列。
     */
    GenPolyline(FromPoint, ToPoint, verticesPoints) {
        // polyline [lat,lng]
        let PolyLine = [];
        PolyLine.push([FromPoint.lat, FromPoint.lng]);

        if (verticesPoints.length > 0) {
            for (let j = 0; j < verticesPoints.length; j++) {
                PolyLine.push([
                    verticesPoints[j].lat,
                    verticesPoints[j].lng]);
            }
        }
        PolyLine.push([ToPoint.lat, ToPoint.lng]);
        return PolyLine;
    }

    /**
     * 產生一個介於 min 和 max 之間的亂數。
     * @param {number} min - 範圍的最小值。
     * @param {number} max - 範圍的最大值。
     * @returns {number} 產生的亂數。
     */
    static Random(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * 在地圖上加入一條管渠的 polyline。
     * @param {number[][]} latlngs - Polyline 的座標陣列。
     * @param {string} color - Polyline 的顏色。
     */
    AddCouduitPolyLine(latlngs, color) {
        let polyline = L.polyline(latlngs, {
            color: color,
            weight: 5
        });

        // 使用者指定的路徑CSV 準備存入資料庫使用
        let User_NodeCSV = this.nodeCSV.join(",");
        let message = `<h6>最短路徑</h6>
        起點:${this.path.StartNode}, 終點:${this.path.EndNode}<br>
        總長度:${this.TotalPathLength.toFixed(2)} (m)<br>
        節點:${User_NodeCSV}<br>
        `;

        let div = InsertPathDiv(message, User_NodeCSV);

        polyline.bindPopup(div, { maxWidth: 400 });

        // polyline存起來
        this.Conduits.push(polyline);

        // polyline加到地圖
        this.map.addLayer(polyline);
    }

    /**
     * 在地圖上為路徑的起點加入一個標記。
     */
    AddStartNode() {
        // this.path.StartNode, this.path.EndNode
        let point = FindNodeCoord(this.coords, this.path.StartNode);

        // Creating a marker
        let marker = L.marker(point, { icon: VioletIcon });
        let message = `起點 :${this.path.StartNode}`;
        marker.bindPopup(message);

        // Adding marker to the map
        // marker.addTo(this.map);
        this.map.addLayer(marker);

        this.Markers.push(marker); // 提供Clear()
    }

    /**
     * 在地圖上為路徑的終點加入一個標記。
     */
    AddEndNode() {
        // this.path.StartNode, this.path.EndNode
        let point = FindNodeCoord(this.coords, this.path.EndNode);

        // Creating a marker
        let marker = L.marker(point, { icon: GreenIcon });
        let message = `終點 :${this.path.EndNode}`;
        marker.bindPopup(message);

        // Adding marker to the map
        marker.addTo(this.map);

        this.Markers.push(marker); // 提供Clear()
    }

    /**
     * 計算並設定路徑的總長度。
     */
    CalculateTotalPathLength() {
        this.TotalPathLength = 0.0;
        for (let i = 0; i < this.path.LinkIds.length; i++) {
            // 累加路徑總長度
            this.TotalPathLength += Number(this.path.PLinks[i].Length);
        }
    }

    /**
     * 繪製單一條路徑的所有管段。
     * @param {DFSPath} data - 要繪製的路徑資料。
     * @returns {void} - 無傳回值。
     */
    DrawPath(data) {

        const hue = DrawPath.Random(1, 300);
        const color = `hsl(${hue},100%,50%)`;

        // 繪製路徑
        for (let i = 0; i < data.LinkIds.length; i++) {
            const link = data.PLinks[i];
            const linkName = link.ID;
            const linkSource = this.linkSources[link.Type];

            if (!linkSource) {
                console.warn(`未知的管段類型: ${link.Type}, linkName: ${linkName}`);
                continue;
            }

            const node12 = FindNodesOfLink(linkSource, linkName);

            if (node12 === undefined) {
                console.warn(`找不到物件! linkName: ${linkName}, Type: ${link.Type}`);
                continue;
            }
            // 找到起點座標{lat,lng}
            const ptFrom = FindNodeCoord(this.coords, node12[0]);
            // 找到終點座標{lat,lng}
            const ptTo = FindNodeCoord(this.coords, node12[1]);
            // 找到起點至終點間所有中間點座標[{lat,lng}]
            const verticPoint = FindVerticesOnLink(this.vertices, linkName);
            // 組合成完整線條[{lat,lng}]
            const latlngs = this.GenPolyline(ptFrom, ptTo, verticPoint);

            this.AddCouduitPolyLine(latlngs, color);
        }
    }

    /**
     * 繪製完整的路徑，包括起點/終點標記和管線。
     * @returns {void} - 無傳回值。
     */
    Draw() {

        // console.log(this.path);
        // 繪製起點Marker
        if (this.path.StartNode !== null)
            this.AddStartNode();

        // 繪製終點Marker
        if (this.path.EndNode !== null)
            this.AddEndNode();

        // 計算總長度
        this.CalculateTotalPathLength();

        if (this.path.LinkIds === null || this.path.LinkIds.length === 0) {
            console.log("無排水路徑資料!")
            return;
        }
        this.DrawPath(this.path);
    }



    /**
     * 從地圖上清除此路徑的所有圖層 (管線和標記)。
     */
    Clear() {
        if (this.Conduits != undefined && this.Conduits.length > 0) {
            // 清除物件
            for (let i = 0; i < this.Conduits.length; i++) {
                this.map.removeLayer(this.Conduits[i]);
            }
            // 清空串列
            this.Conduits = [];
            // 重設路徑總長度
            this.TotalPathLength = 0;
        }
        // 清除標註Markers
        if (this.Markers != undefined && this.Markers.length > 0) {
            for (let i = 0; i < this.Markers.length; i++) {
                this.map.removeLayer(this.Markers[i]);
            }
            // 清空串列 
            this.Markers = [];
        }
    }
}


// *************
// * 繪製路徑圖 *
// *************

let Paths = [];

/** 
 * 在地圖上繪製多條靜態路徑。
 * @param {L.Map} SwmmMap - Leaflet 地圖物件。
 * @param {DFSPath[]} pathData - 包含多條路徑的陣列。
 * @param {any} data - SWMM 專案資料 (COORDINATES, CONDUITS, etc.)。
 */
export function DrawPaths(SwmmMap, pathData, data) {
    // 先清掉原來的路徑圖
    if (Paths.length > 0) ClearAllPaths();

    Paths = [];
    // console.log({ pathData: pathData })
    if ((pathData === undefined) || (pathData.length === 0)) {
        console.log("no path data!");
        return;
    }
    let N = pathData.length;
    // console.log({ count: N });
    for (let i = 0; i < N; i++) {

        Paths.push(new DrawPath(
            SwmmMap,
            pathData[i],
            data.COORDINATES,
            data.CONDUITS,
            data.WEIRS,
            data.ORIFICES,
            data.PUMPS,
            data.VERTICES));

        // Draw the path
        Paths[i].Draw();
    }
}


/**
 * 清除現有路徑並在地圖上繪製單一條靜態路徑。
 * @param {L.Map} SwmmMap - Leaflet 地圖物件。
 * @param {DFSPath} singlePathData - 要繪製的單一路徑資料。
 * @param {any} data - SWMM 專案資料 (COORDINATES, CONDUITS, etc.)。
 */
export function DrawSinglePath(SwmmMap, singlePathData, data) {
    // 先清掉原來的路徑圖
    if (Paths.length > 0) ClearAllPaths();

    Paths = [];

    Paths.push(new DrawPath(
        SwmmMap,
        singlePathData,
        data.COORDINATES,
        data.CONDUITS,
        data.WEIRS,
        data.ORIFICES,
        data.PUMPS,
        data.VERTICES));

    // Draw the path
    Paths[0].Draw();
}


/** 
 * 從地圖上清除所有已繪製的路徑。
 */
export function ClearAllPaths() {
    if (Paths === undefined) return;
    for (let i = 0; i < Paths.length; i++) {
        Paths[i].Clear();
    }
}