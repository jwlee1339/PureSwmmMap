// DrawCentroids.js 
// leafletjs
// 繪製子集水區重心
// class version
// 2024-11-06

'use strict'

import { distance, CreateCenteredBox as CenteredBox, FindNodeCoord } from '../Map2D.js'

const DEFAULT_SUBCATCHMENT_BASE = {
    RainGage: "None",
    Outlet: "None",
    Area: "None",
    Imperv: "None",
    Width: "None",
    Slope: "None"
};

const DEFAULT_SUBAREA_DATA = {
    N_Imperv: "None",
    N_Perv: "None",
    S_Imperv: "None",
    S_Perv: "None",
    PctZero: "None",
    RouteTo: "None"
};

export class DrawCentroids {

    /**
     * @constructor
     * @param {L.Map} map Leaflet 地圖物件
     * @param {any} coords 座標資料
     * @param {any[]} polygons 子集水區多邊形頂點資料
     * @param {any[]} subcatchments 子集水區基本資料
     * @param {any} subareas 子集水區細部資料
     * @param {number} [size=8] 重心標記的大小
     */
    constructor(map, coords, polygons, subcatchments, subareas, size) {
        this.map = map;
        /** @type {any} 座標資料 [COORDINATES] */
        this.coords = coords;
        /** @type {any[]} 子集水區多邊形頂點資料 [POLYGONS] */
        this.polygons = polygons;

        /** 
         * @private
         * @type {Map<string, object>} 
         */
        this._subcatchmentsMap = (subcatchments || []).reduce((map, item) => {
            map.set(item.Name, item);
            return map;
        }, new Map());

        /** 
         * @private
         * @type {Map<string, object>} 
         */
        this._subareasMap = (subareas || []).reduce((map, item) => {
            map.set(item.Subcatchment, item);
            return map;
        }, new Map());

        /** @private @type {L.LayerGroup} 用於存放所有繪製圖層的圖層組 */
        this._layerGroup = L.layerGroup().addTo(this.map);
        /** @type {number} 重心標記的大小 */
        this.size = size || 8;
        /** @type {number} 所有子集水區的總面積 */
        this.TotalArea = 0.0;
    }

    /**
     * 取得計算後的總面積
     * @returns {number} 總面積
     */
    GetTotalArea() {
        return this.TotalArea;
    }

    /**
     * 從多邊形資料中找出所有不重複的子集水區名稱
     * @returns {string[]} 子集水區名稱陣列
     */
    FindDifferentSubNames() {

        let tmpArray = [];

        this.polygons.forEach(x => {
            // 檢查名稱是否已存在於陣列中
            let isInSubNames = tmpArray.includes(x.name);
            // 若不存在，則將其加入陣列
            if (!isInSubNames) {
                tmpArray.push(x.name);
            }
        });
        return tmpArray;
    }

    /**
     * 根據子集水區名稱，從預先處理的 Map 中取得其基本資料
     * @param {string} subName 子集水區名稱
     * @returns {object} 子集水區的基本資料物件
     */
    GetSubcatchmentBaseData(subName) {
        return this._subcatchmentsMap.get(subName) || {
            Name: subName,
            ...DEFAULT_SUBCATCHMENT_BASE
        };
    }

    /**
     * 根據子集水區名稱，從預先處理的 Map 中取得其細部資料
     * @param {string} subName 子集水區名稱
     * @returns {object} 子集水區的細部資料物件
     */
    GetSubcatchmentSubareaData(subName) {
        return this._subareasMap.get(subName) || {
            Subcatchment: subName,
            ...DEFAULT_SUBAREA_DATA
        };
    }

    /**
     * 根據子集水區名稱取得其邊界多邊形的所有頂點
     * @param {string} SubName 子集水區名稱
     * @returns {any[]} 多邊形頂點陣列
     */
    GetSubcatchmentPolygon(SubName) {
        let results = this.polygons.filter(x => x.name === SubName);
        return results;
    }

    /**
     * 取得指定子集水區多邊形的每個頂點座標
     * @param {string} SubName 子集水區名稱
     * @returns {number[][]} 頂點座標陣列 [[lat, lng], ...]
     */
    GetVertex(SubName) {
        // 過濾取出某集水區的多邊形資料
        let subPolygon = this.GetSubcatchmentPolygon(SubName);
        // console.log(subPolygon);

        // 整理成 Leaflet 需要的 latlngs 格式
        let latlngs = [];
        subPolygon.forEach(x => {
            // console.log('polyLine : ', x);
            latlngs.push([x.lat, x.lng]);
        });
        return latlngs;
    }

    /**
     * 使用高斯面積公式計算多邊形面積
     * 順時針為負值、逆時針為正值
     * @param {number[][]} latlngs 多邊形頂點座標陣列
     * @returns {number} 多邊形面積
     */
    Area(latlngs) {
        let sum = 0.0;
        // console.log(latlngs)
        for (let i = 0; i < latlngs.length - 1; i++) {
            let x1 = latlngs[i][1];
            let y1 = latlngs[i][0];
            let x2 = latlngs[i + 1][1];
            let y2 = latlngs[i + 1][0];
            // console.log({x1:x1, y1:y1, x2:x2, y2:y2})
            sum += x1 * y2 - x2 * y1;
        }
        return sum / 2.0;
    }

    /**
     * 計算兩個頂點之間的距離
     * @param {number[][]} latlngs 頂點座標陣列
     * @param {number} i 第一個點的索引
     * @param {number} j 第二個點的索引
     * @returns {number} 兩點之間的距離
     */
    DistanceBetweenTwoPoints(latlngs, i, j) {
        let firstPoint = {
            lat: latlngs[i][1],
            lng: latlngs[i][0]
        }
        let lastPoint = {
            lat: latlngs[j][1],
            lng: latlngs[j][0]
        }
        // 計算距離
        let dist = distance(firstPoint.lng, firstPoint.lat,
            lastPoint.lng, lastPoint.lat);
        return dist;
    }

    /**
     * 計算多邊形的中心點(重心)座標
     * @param {string} subName 子集水區名稱
     * @returns {{lng: number, lat: number} | null} 中心點座標物件，如果無法計算則返回 null
     */
    Center(subName) {
        const latlngs = this.GetVertex(subName);
        // 只有2點不能構成多邊形
        if (latlngs.length < 3) {
            return null;
        }

        // 確保多邊形是封閉的。為避免副作用，在副本上操作。
        const closedLatLngs = [...latlngs];
        if (this.DistanceBetweenTwoPoints(closedLatLngs, 0, closedLatLngs.length - 1) > 1.0e-6) {
            closedLatLngs.push(closedLatLngs[0]);
        }

        let area = 0;
        let cx = 0, cy = 0;

        // 在單一循環中計算面積和重心
        for (let i = 0; i < closedLatLngs.length - 1; i++) {
            const p1 = closedLatLngs[i];
            const p2 = closedLatLngs[i + 1];
            const x1 = p1[1]; // lng
            const y1 = p1[0]; // lat
            const x2 = p2[1]; // lng
            const y2 = p2[0]; // lat

            const crossProduct = (x1 * y2 - x2 * y1);
            area += crossProduct;
            cx += (x1 + x2) * crossProduct;
            cy += (y1 + y2) * crossProduct;
        }

        const finalArea = area / 2.0;

        // 避免除以零，對於沒有面積的多邊形（例如一條線）回傳 null
        if (Math.abs(finalArea) < 1e-9) {
            return null;
        }

        const factor = 1 / (6 * finalArea);
        return {
            lng: cx * factor,
            lat: cy * factor
        };
    }

    /**
     * 在地圖上指定座標加入一個方形標記作為重心
     * @param {number[]} coord 中心點座標 [lat, lng]
     * @returns {L.Rectangle} Leaflet 的矩形圖層物件
     */
    AddCentroid(coord) {

        let boxWidth = 0.003 * this.size;
        let boxHeight = 0.004 * this.size;
        let color = "brown";
        // 計算長方形的左下角與右上角座標
        // console.log({ coord: coord })
        let bounds = CenteredBox(coord, boxHeight, boxWidth);
        // console.log(bounds)
        let rect = L.rectangle(bounds, {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 1
        });
        // 將圖層加到圖層組中
        this._layerGroup.addLayer(rect);
        return rect;
    }

    /**
     * 繪製從重心到指定節點的虛線
     * @param {{ lng: number; lat: number; }} centroid 重心座標
     * @param {{ lat: number; lng: number; }} coord 目標節點座標
     */
    // dark-drey : #3a3a3a
    // "#f1f1f1"; light-grey
    DrawDashedLine(centroid, coord) {
        let latlngs = [];
        latlngs.push(centroid);
        latlngs.push(coord);
        let color = "#3a3a3a"; // light-grey
        let dashedLine = L.polyline(latlngs, {
            color: color,
            dashArray: "10 2",
            weight: 1
        });
        // 將虛線圖層加到圖層組中
        this._layerGroup.addLayer(dashedLine);
    }

    /**
     * 產生子集水區資訊的 HTML 字串，用於彈出視窗
     * @param {object} sb 子集水區基本資料
     * @param {object} sa 子集水區細部資料
     * @returns {string} HTML 格式的資訊字串
     */
    GetSubcatchmentMessage(sb, sa) {
        let message = `<span style="font-weight:900">子集水區:${sb.Name}</span><br><hr>
                面積:${sb.Area}(公頃)<br>
                不透水面積比例:${sb.Imperv}%<br>
                流入節點:${sb.Outlet}<br>
                雨量站:${sb.RainGage}<br>
                坡度:${sb.Slope}%<br>
                寬度:${sb.Width}(m)<br>
                <hr>
                N-Imperv:${sa.N_Imperv}<br>
                N-Perv:${sa.N_Perv}<br>
                S-Imperv:${sa.S_Imperv}(m)<br>
                S-Imperv:${sa.S_Perv}(m)<br>
                PctZero:${sa.PctZero}<br>
                `;
        return message;
    }

    /**
     * 繪製所有子集水區的重心及與其對應節點的虛線
     */
    Draw() {

        // console.log(PolyArray);

        if (this.polygons == null || this.polygons.length == 0)
            return;

        // 1. 取出所有不重複的集水區名稱
        const subcatchmentNames = this.FindDifferentSubNames();

        subcatchmentNames.forEach(subName => {
            // 取得子集水區基本資料 - Area...
            let sb = this.GetSubcatchmentBaseData(subName);
            // console.log(sb);
            // 取得子集水區基本資料 - N_Imperv...
            let sa = this.GetSubcatchmentSubareaData(subName);
            let message = this.GetSubcatchmentMessage(sb, sa);

            // 2. 計算多邊形中心點(重心)座標 
            let centroid = this.Center(subName);
            // console.log('subName:', subName, { centroid: centroid });
            if (centroid !== null) {

                // 3. 在地圖加上一個方形標記
                let coord = [];
                coord.push(centroid.lat);
                coord.push(centroid.lng);
                let rect = this.AddCentroid(coord);
                rect.bindPopup(message, { maxWidth: 560 });
                // 4. 繪製重心到其對應流出節點的虛線
                let outletCoord = FindNodeCoord(this.coords, sb.Outlet);
                this.DrawDashedLine(centroid, outletCoord);

                // 5. 累加總面積
                this.TotalArea += Number(sb.Area);
                
            } else {
                console.warn(`subName:${subName},多邊形點數不足3點!`);
            }

        });

    }

    /**
     * 清除所有由這個類別在圖層組中繪製的圖層 (重心和虛線)。
     * 這是透過 Leaflet 的 `clearLayers` 方法完成，比逐一移除更有效率。
     */
    Clear() {
        this._layerGroup.clearLayers();
    }

}



/*
[SUBCATCHMENTS]
{
    Area: "32.83"
    Imperv: "40"
    Name: "2"
    Outlet: "yu5.4"
    RainGage: "Rain"
    Slope: "1.2"
    Width: "100"
}
[SUBAREAS]
 {
    "Subcatchment": "A1",
    "N_Imperv": "0.018",
    "N_Perv": "0.25",
    "S_Imperv": "0.05",
    "S_Perv": "0.05",
    "PctZero": "25",
    "RouteTo": "OUTLET"
}


{
lat: 24.968707108333696
lng: 121.24889973605202
name: "A1"
x_97: 275130.349
y_97: 2762334.552
}

fillColor: "red",
fillOpacity: 0.1
*/