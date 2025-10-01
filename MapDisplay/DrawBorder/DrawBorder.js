// DrawBorder.js
// 2023-08-11

import { DrawSubcatchments } from "../DrawSwmm/DrawSubcatchments.js";

export class DrawBorder {

    constructor(map, border) {
        this.map = map;
        this.border = border;
        // local
        this.subcatchmentsPolygons = [];
    }

    // 取得多邊形的每個頂點座標
    /**
     * @param {any} SubName
     */
    GetVertexTWD97() {

        // 繪圖
        let latlngs = [];
        this.border.forEach(x => {
            // console.log('polyLine : ', x);
            latlngs.push([x.x_97, x.y_97]);

        });
        return latlngs;
    }

    // 取得多邊形的每個頂點座標
    GetVertex() {

        // 繪圖
        let latlngs = [];
        this.border.forEach(x => {
            // console.log('polyLine : ', x);
            latlngs.push([x.lat, x.lng]);
        });
        return latlngs;
    }

    // 繪製單一子集水區多邊形 Leaflet

    Draw() {
        if (this.border === undefined || this.border === null) {
            console.warn("沒有集水區邊界資料!")
            return;
        }
        // 繪圖
        let latlngs = this.GetVertex();
        //console.log({ latlngs });

        // Draw a polygon of subcatchment
        let color = 'red';

        let polygon = L.polygon(latlngs,
            {
                color: 'red',    // line color
                fill: false,       // 不填滿
                fillColor: color,   // inter color
                weight: 2            // line width
            });

        // Add a mouseover event to the polygon
        polygon.on('mouseover', function (e) {
            console.log('mouseover on polygon');
            // Change the style of the polygon on mouseover
            polygon.setStyle({
                color: 'blue',
                fillColor: 'blue'
            });
        });

        // add polygon to map
        this.map.addLayer(polygon);
        this.subcatchmentsPolygons.push(polygon);
        this.map.fitBounds(polygon.getBounds());
        // 多邊形的面積
        let twd97 = this.GetVertexTWD97();
        let Area = DrawSubcatchments.Area(twd97) / 10000.0;
        console.log("Area of DMBorder(ha):", Area.toFixed(2));
        return;
    }


    // 清除子集水區多邊形
    Clear() {
        if (this.subcatchmentsPolygons !== undefined && this.subcatchmentsPolygons.length > 0) {
            for (let i = 0; i < this.subcatchmentsPolygons.length; i++) {
                this.map.removeLayer(this.subcatchmentsPolygons[i]);
            }
            // 清空串列
            this.subcatchmentsPolygons = [];
        }
    }
}