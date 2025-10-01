// DrawSubcatchments.cs 
// leafletjs
// 僅繪製子集水區邊界
// class version
// 2021-11-14

'use strict'

import { distance } from '../Map2D.js'
import { myAlert, GREENCOLOR } from '../myAlert.js';
import { flashLayer } from '../mapUtils.js';

/**
 * 繪製 SWMM 的子集水區 (Subcatchments) 到 Leaflet 地圖上。
 * 這個類別負責處理子集水區的邊界繪製、資料查詢及互動效果。
 */
export class DrawSubcatchments {

    /**
     * @param {L.Map} map Leaflet 地圖實例。
     * @param {Array<object>} coords 包含節點座標的陣列 ([COORDINATES])。
     * @param {Array<object>} polygons 包含子集水區多邊形頂點的陣列 ([POLYGONS])。
     * @param {Array<object>} subcatchments 包含子集水區資料的陣列 ([SUBCATCHMENTS])。
     * @param {Array<object>} subareas 包含子區域資料的陣列 ([SUBAREAS])。
     * @param {number} [size=8] 尺寸參數 (目前未使用)。
     */
    constructor(map, coords, polygons, subcatchments, subareas, size) {
        /** @type {L.Map} Leaflet 地圖實例 */
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [POLYGONS]
        this.polygons = polygons;
        // [SUBCATCHMENTS]
        this.subcatchments = subcatchments;
        // [SUBAREAS]
        this.subareas = subareas;
        // 子集水區名稱
        /** @type {string[]} 不重複的子集水區名稱陣列，例如 ["A1", "1", "A3", "2"] */
        this.SubcatchNames = []; // ex.["A1", "1", "A3", "2"];
        // 多邊形array，可清除
        /** @type {Array<L.Polygon>} 用於存放已繪製的多邊形圖層，方便後續清除 */
        this.subcatchmentsPolygons = [];
        this.size = size || 8;
        // 總面積
        /** @type {number} 已繪製子集水區的總面積 */
        this.TotalArea = 0.0;
    }

    /**
     * 取得已繪製子集水區的總面積。
     * @returns {number} 總面積 (公頃)。
     */
    GetTotalArea() {
        return this.TotalArea;
    }

    /**
     * 從 [POLYGONS] 資料中找出所有不重複的子集水區名稱。
     * @returns {string[]} 子集水區名稱的陣列。
     */
    FindDifferentSubNames() {

        let tmpArray = [];

        this.polygons.forEach(x => {
            // 檢查是否已存在這個集水區名稱
            let isInSubNames = tmpArray.includes(x.name);
            // 若不存在，則加入
            if (!isInSubNames) {
                tmpArray.push(x.name);
            }
        });
        return tmpArray;
    }

    /**
     * 從 [SUBCATCHMENTS] 資料中，根據名稱找到子集水區的基本資料。
     * @param {string} subName - 子集水區的名稱。
     * @returns {object} 子集水區的資料物件，若找不到則回傳預設物件。
     */
    GetSubcatchmentBaseData(subName) {
        let result = this.subcatchments.filter(x => x.Name === subName);
        if (result.length > 0) {
            return result[0];
        } else {
            return {
                "Name": subName,
                "RainGage": "None",
                "Outlet": "None",
                "Area": "None",
                "Imperv": "None",
                "Width": "None",
                "Slope": "None"
            };
        }
    }

    /**
     * 從 [SUBAREAS] 資料中，根據名稱找到子集水區的次要基本資料。
     * @param {string} subName - 子集水區的名稱。
     * @returns {object} 子區域的資料物件，若找不到則回傳預設物件。
     */
    GetSubcatchmentBaseData1(subName) {

        let result = this.subareas.filter(x => x.Subcatchment === subName);
        if (result.length > 0) {
            return result[0];
        } else {
            return {
                "Subcatchment": subName,
                "N_Imperv": "None",
                "N_Perv": "None",
                "S_Imperv": "None",
                "S_Perv": "None",
                "PctZero": "None",
                "RouteTo": "None"
            };
        }
    }

    /**
     * 根據子集水區名稱，取得其邊界多邊形的所有頂點。
     * @param {string} SubName - 子集水區的名稱。
     * @returns {Array<object>} 構成多邊形的頂點物件陣列。
     */
    GetSubcatchmentPolygon(SubName) {
        let results = this.polygons.filter(x => x.name === SubName);
        return results;
    }

    /**
     * 根據子集水區名稱，取得其多邊形頂點的經緯度座標陣列。
     * @param {string} SubName - 子集水區的名稱。
     * @returns {Array<[number, number]>} 頂點的經緯度陣列 `[[lat, lng], ...]`。
     */
    GetVertex(SubName) {
        // 過濾取出某集水區
        let subPolygon = this.GetSubcatchmentPolygon(SubName);
        // console.log(subPolygon);

        // 繪圖
        let latlngs = [];
        subPolygon.forEach(x => {
            // console.log('polyLine : ', x);
            latlngs.push([x.lat, x.lng]);
        });
        return latlngs;
    }

    /**
     * (靜態方法) 計算多邊形面積。
     * 使用鞋帶公式 (Shoelace formula)。順時針為負值，逆時針為正值。
     * @static
     * @param {Array<[number, number]>} latlngs - 多邊形的頂點經緯度陣列。
     * @returns {number} 多邊形的面積。
     */
    static Area(latlngs) {
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
     * (實例方法) 計算多邊形面積。
     * 使用鞋帶公式 (Shoelace formula)。順時針為負值，逆時針為正值。
     * @param {Array<[number, number]>} latlngs - 多邊形的頂點經緯度陣列。
     * @returns {number} 多邊形的面積。
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
     * 計算頂點陣列中兩個指定索引點之間的距離。
     * @param {Array<[number, number]>} latlngs - 頂點經緯度陣列。
     * @param {number} i - 第一個點的索引。
     * @param {number} j - 第二個點的索引。
     * @returns {number} 兩點之間的距離。
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
     * 繪製單一子集水區的多邊形到地圖上，並綁定互動事件。
     * @param {string} SubName - 要繪製的子集水區名稱。
     * @returns {L.Polygon} 建立的 Leaflet 多邊形圖層。
     */
    DrawSinglePolygon(SubName) {

        // 繪圖
        let latlngs = this.GetVertex(SubName);
        //console.log({latlngs})

        // Draw a polygon of subcatchment
        let color = 'hsl(' + 200 + ',80%,80%)';

        let polygon = L.polygon(latlngs,
            {
                color: 'black',    // line color
                fill: true,       // 不填滿
                fillColor: color,   // inter color
                weight: 1            // line width
            });

        // 綁定 Tooltip，當滑鼠移上時顯示子集水區名稱
        polygon.bindTooltip(SubName, {
            className: 'custom-swmm-tooltip',
            permanent: false,
            direction: 'auto'
        });

        // Add a mouseover event to the polygon
        // 滑鼠進入區域後 改變顏色
        polygon.on('mouseover', function (e) {
            //console.log('mouseover on polygon');
            // Change the style of the polygon on mouseover
            polygon.setStyle({
                color: 'blue',
                fillColor: 'blue'
            });
        });
        // 離開後 恢復原狀
        polygon.on('mouseout', function (e) {
            //console.log('mouseover on polygon');
            // Change the style of the polygon on mouseover
            polygon.setStyle({
                color: 'black',    // line color
                fill: true,       // 不填滿
                fillColor: color,   // inter color
                weight: 1            // line width
            });
        });

        // 滑鼠點擊區域後，邊界閃爍以示強調
        // Popup由外部的 .bindPopup() 處理，Leaflet會自動在點擊時顯示
        polygon.on('click', (e) => {
            const clickedPolygon = e.target;

            // --- 邊界閃爍效果 ---
            // 儲存點擊當下的邊界樣式，通常是滑鼠移入時的藍色
            const originalBorderStyle = {
                color: clickedPolygon.options.color,
                weight: clickedPolygon.options.weight
            };
            const flashBorderStyle = {
                color: '#e51c23', // 閃爍時的亮紅色
                weight: 3         // 閃爍時的寬度
            };
            let flashCount = 0;
            const maxFlashes = 3; // 總共閃爍3次 (亮/暗 * 3)
            const interval = 150; // 閃爍間隔 (ms)

            const flash = () => {
                if (flashCount >= maxFlashes * 2) {
                    // 閃爍結束後，恢復點擊前的邊界樣式
                    clickedPolygon.setStyle(originalBorderStyle);
                    return;
                }
                // 交替設定閃爍樣式和原始樣式 (只改變邊界，不影響填充色)
                clickedPolygon.setStyle(flashCount % 2 === 0 ? flashBorderStyle : originalBorderStyle);
                flashCount++;
                setTimeout(flash, interval);
            };
            flash(); // 啟動閃爍
        });

        this.subcatchmentsPolygons.push(polygon);
        // add polygon to map
        this.map.addLayer(polygon);
        return polygon;
    }

    /**
     * 組合子集水區的資訊，產生用於彈出視窗(Popup)的 HTML 訊息字串。
     * @param {object} sb - 來自 [SUBCATCHMENTS] 的資料物件。
     * @param {object} sa - 來自 [SUBAREAS] 的資料物件。
     * @returns {string} HTML 格式的訊息字串。
     */
    GetSubcatchmentMessage(sb, sa) {
        const message = `
            <h6>子集水區: <strong>${sb.Name}</strong></h6>
            <style>
                .subcatchment-popup-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 5px; }
                .subcatchment-popup-table th, .subcatchment-popup-table td { border: 1px solid #ccc; padding: 4px; text-align: left; }
                .subcatchment-popup-table th { font-weight: bold; background-color: #f2f2f2; width: 120px; }
            </style>
            <table class="subcatchment-popup-table">
                <tr><th>面積 (公頃)</th><td>${sb.Area}</td></tr>
                <tr><th>不透水面積比例 (%)</th><td>${sb.Imperv}</td></tr>
                <tr><th>流入節點</th><td>${sb.Outlet}</td></tr>
                <tr><th>雨量站</th><td>${sb.RainGage}</td></tr>
                <tr><th>坡度 (%)</th><td>${sb.Slope}</td></tr>
                <tr><th>寬度 (m)</th><td>${sb.Width}</td></tr>
                <tr><th>N-Imperv</th><td>${sa.N_Imperv}</td></tr>
                <tr><th>N-Perv</th><td>${sa.N_Perv}</td></tr>
                <tr><th>S-Imperv (m)</th><td>${sa.S_Imperv}</td></tr>
                <tr><th>S-Perv (m)</th><td>${sa.S_Perv}</td></tr>
                <tr><th>PctZero</th><td>${sa.PctZero}</td></tr>
            </table>`;
        return message;
    }

    /**
     * 繪製所有子集水區到地圖上。
     * 會迭代所有不重複的子集水區名稱，並為每一個繪製多邊形及綁定 Popup。
     */
    Draw() {

        // console.log(PolyArray);

        if (this.polygons == null || this.polygons.length == 0)
            return;

        // 取出所有集水區名稱
        this.SubcatchNames = this.FindDifferentSubNames();
        // console.log(this.SubcatchNames);
        this.TotalArea = +0.0;

        this.SubcatchNames.forEach(subName => {
            // 取得子集水區基本資料 - Area...
            let sb = this.GetSubcatchmentBaseData(subName);
            // console.log(sb);
            // 取得子集水區基本資料 - N_Imperv...
            let sa = this.GetSubcatchmentBaseData1(subName);
            let message = this.GetSubcatchmentMessage(sb, sa);

            // 生成多邊形
            let polygon = this.DrawSinglePolygon(subName);
            polygon.bindPopup(message);
            // 計算集水區面積
            this.TotalArea += Number(sb.Area);
        });
        let msg = `面積=${this.TotalArea.toFixed(2)}(ha)`
        myAlert(msg, GREENCOLOR, 30000);
        console.log(msg);

        // zoom the map to the polygon
        // map.fitBounds(polygon.getBounds());

    }
    /**
     * 根據提供的子集水區名稱列表，繪製過濾後的多邊形。
     * @param {string[]} sub_names - 要繪製的子集水區名稱陣列。
     */
    DrawFilteredBasins(sub_names) {
        if (this.polygons == null || this.polygons.length == 0)
            return;
        this.TotalArea = +0.0;
        sub_names.forEach(subName => {
            // 取得子集水區基本資料 - Area...
            let sb = this.GetSubcatchmentBaseData(subName);
            // console.log(sb);
            // 取得子集水區基本資料 - N_Imperv...
            let sa = this.GetSubcatchmentBaseData1(subName);
            let message = this.GetSubcatchmentMessage(sb, sa);

            // 生成多邊形
            let polygon = this.DrawSinglePolygon(subName);
            polygon.bindPopup(message);
            // console.log(sb);
            // 計算集水區面積
            this.TotalArea += Number(sb.Area);
        });
        let msg = `面積=${this.TotalArea.toFixed(2)}(ha)`
        console.log(msg);

        // 繪圖完成後，自動縮放到所有繪製的多邊形的範圍
        if (this.subcatchmentsPolygons.length > 0) {
            const featureGroup = L.featureGroup(this.subcatchmentsPolygons);
            this.map.fitBounds(featureGroup.getBounds());
        }
    }

    /**
     * 從地圖上清除所有已繪製的子集水區多邊形圖層。
     */
    Clear() {
        if (this.subcatchmentsPolygons != undefined && this.subcatchmentsPolygons.length > 0) {
            for (let i = 0; i < this.subcatchmentsPolygons.length; i++) {
                this.map.removeLayer(this.subcatchmentsPolygons[i]);
            }
            // 清空串列
            this.subcatchmentsPolygons = [];
        }

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