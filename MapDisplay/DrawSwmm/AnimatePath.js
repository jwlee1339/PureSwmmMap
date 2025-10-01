// AnimatePath.js : 繪製單一路徑且marker 逐個節點移動
// 2023-11-28


import { FindNodesOfLink, FindNodeCoord, FindVerticesOnLink, VioletIcon, GreenIcon } from "../Map2D.js";

// input variables :
// SwmmMap, rende_det_path, data.COORDINATES, data.CONDUITS, data.VERTICES
let User_NodeCSV = "";
// 動畫用
let intervalID;

export class AnimatePath {
    /**
     * @param {any} map
     * @param {any} path
     * @param {any} coords
     * @param {any} conduits
     * @param {any} weirs
     * @param {any} orifices
     * @param {any} pumps
     * @param {any} vertices
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
        // 終點marker
        this.EndMarker;
        // 動態節點index
        this.node_index = 0;
        // this.path.NodeIds -> 路徑上的節點名稱
    }
    // ------------------------------
    // generate polyline
    // FromPoint : 管渠起點座標
    // ToPoint : 管渠終點座標
    // VerticsPoints : 管渠中間點座標
    // 回傳 : latlngs
    // ------------------------------

    /**
     * @param {{ lat: number; lng: number; }} FromPoint
     * @param {{ lat: number; lng: number; }} ToPoint
     * @param { number[][]} verticesPoints
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
    // add Conduit polyline(折線、多重線、多線)

    /**
     * @param {any[][]} latlngs
     * @param {string} color
     */
    AddCouduitPolyLine(latlngs, color) {
        let polyline = L.polyline(latlngs, {
            color: color,
            weight: 5
        });

        // 使用者指定的路徑CSV 準備存入資料庫使用
        User_NodeCSV = this.nodeCSV.join(",");

        let message = `<h6>最短路徑</h6>
        起點:${this.path.StartNode}, 終點:${this.path.EndNode}<br>
        總長度:${this.TotalPathLength.toFixed(2)} (m)<br>
        節點:${this.nodeCSV.join(",")}<br>
        `;

        const div = document.createElement("div");
        div.innerHTML = message;
       

        polyline.bindPopup(div, { maxWidth: 400 });

        // polyline存起來
        this.Conduits.push(polyline);

        // polyline加到地圖
        this.map.addLayer(polyline);
    }

    /**
     * 加入標註 起點
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
     * 加入標註 終點
     * @param {string} end_node 終點節點名稱
     */
    AddEndNode(end_node) {
        // this.path.StartNode, this.path.EndNode
        let point = FindNodeCoord(this.coords, end_node);

        // Creating a marker
        this.EndMarker = L.marker(point, { icon: GreenIcon });
        let message = `節點 :${end_node}`;
        this.EndMarker.bindPopup(message)
        
        // Adding marker to the map
        this.EndMarker.addTo(this.map);
        // open the popup - 必須放在addTo() 之後
        this.EndMarker.openPopup();
    }
    /**
     * @param {number} min
     * @param {number} max
     */
    static Random(min, max) {
        return min + Math.random() * (max - min);
    }
    /**
     * 計算路徑總長度
     */
    CalculateTotalPathLength() {
        this.TotalPathLength = 0.0;
        for (let i = 0; i < this.path.LinkIds.length; i++) {
            // 累加路徑總長度
            this.TotalPathLength += Number(this.path.PLinks[i].Length);
        }
    }
    /**
   * 繪製整條路徑 
   * @param {{LinkIds,PLinks}} data
   * @returns
   */
    AnimateDrawPath(data) {

        let hue = AnimatePath.Random(1, 300);
        let color = 'hsl(' + hue + ',100%,50%)';

        // 繪製路徑
        for (let i = 0; i < data.LinkIds.length; i++) {
            let linkName = data.LinkIds[i];
            let node12;
            if (data.PLinks[i].Type === 'WEIR') {
                node12 = FindNodesOfLink(this.weirs, linkName);
            } else if (data.PLinks[i].Type === 'CONDUIT') {
                node12 = FindNodesOfLink(this.conduits, linkName);
            } else if (data.PLinks[i].Type === 'ORIFICE') {
                node12 = FindNodesOfLink(this.orifices, linkName);
            }
            else if (data.PLinks[i].Type === 'PUMP') {
                node12 = FindNodesOfLink(this.pumps, linkName);
            }

            if (node12 === undefined) {
                console.log("找不到物件! linkName : ", linkName);
                return;
            }
            // 找到起點座標{lat,lng}
            let ptFrom = FindNodeCoord(this.coords, node12[0]);
            // 找到終點座標{lat,lng}
            let ptTo = FindNodeCoord(this.coords, node12[1]);
            // 找到起點至終點間所有中間點座標[{lat,lng}]
            let verticPoint = FindVerticesOnLink(this.vertices, linkName);
            // 組合成完整線條[{lat,lng}]
            let latlngs = this.GenPolyline(ptFrom, ptTo, verticPoint);

            this.AddCouduitPolyLine(latlngs, color);
        }
    }

    StartAnimate() {
        intervalID = setInterval(() => {

            // 清除EndMarker
            if (this.EndMarker !== undefined) {
                this.map.removeLayer(this.EndMarker);
            }

            // * 前進到下一個節點
            this.node_index++;
            if (this.node_index >= this.path.NodeIds.length) {
                this.node_index = 0;
            }
            // 繪製終點Marker
            this.AddEndNode(this.path.NodeIds[this.node_index]);
        }, 500);
    }

    StopAnimate() {
        clearTimeout(intervalID);
    }

    /**
    * 繪製路徑 到達marker會逐節點移動
    * @returns
    */
    AnimateDraw() {

        // console.log(this.path);
        // 繪製起點Marker
        if (this.path.StartNode !== null)
            this.AddStartNode();

        // 計算總長度
        this.CalculateTotalPathLength();

        if (this.path.LinkIds === null || this.path.LinkIds.length === 0) {
            console.log("無排水路徑資料!")
            return;
        }
        this.AnimateDrawPath(this.path);

        // 開始動畫
        this.StartAnimate();
    }
    // 清除圖面
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
        // EndMarker
        if (this.EndMarker !== undefined) {
            this.map.removeLayer(this.EndMarker);
        }
        // 停止動畫
        this.StopAnimate();
    }
}

let Path;

/**只繪製1條動態路徑 */
export function DrawSingleAnimatePath(SwmmMap, singlePathData, data) {
    // 先清掉原來的路徑圖
    if (Path !== undefined) ClearAimatePath();

    Path = new AnimatePath(
        SwmmMap,
        singlePathData,
        data.COORDINATES,
        data.CONDUITS,
        data.WEIRS,
        data.ORIFICES,
        data.PUMPS,
        data.VERTICES);

    // Draw the path
    Path.AnimateDraw();
}

/** 重新開始動態 */
export function ReStartAimatePath() {
    if (Path === undefined) return;
    Path.StartAnimate();
}

/** 停止動態 */
export function StopAimatePath() {
    if (Path === undefined) return;
    Path.StopAnimate();
}

/** 清除所有動態路徑物件*/
export function ClearAimatePath() {
    if (Path === undefined) return;
    Path.Clear();
    Path = undefined;
}