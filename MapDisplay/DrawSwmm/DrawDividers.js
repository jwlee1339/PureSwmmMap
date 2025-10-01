// DrawDividers.js
// leaflet
// class version
// 2021-11-24

'use strict'

import { FindNodeCoord } from "../Map2D.js";
import { Base } from "../GetBaseData.js";

// 繪製節點[DIVIDERS]

export class DrawDividers {
    
    /**
     * @param {any} map
     * @param {{name: string, "x_97": number, "y_97": number, "lng": number, "lat": number}[]} coords
     * @param {any} nodes
     * @param {any} curves
     * @param {number} radius
     */
    constructor(map, coords, nodes, curves, radius) {
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [JUNCTIONS], [STORAGE], [OUTFALLS]
        this.nodes = nodes;
        // "JUNCTIONS","STORAGE", "OUTFALLS"
        // 曲線
        this.curves = curves;
        // 節點圓半徑
        this.radius = radius || 8;  // 預設為10px
        // 清除用的串列
        this.Nodes = [];
        // 查詢用的Marker
        this.Marker;
    }

    // * get node type string
    //     [DIVIDERS]
    // ;;Name           Elevation  Diverted Link    Type       Parameters
    // ;;-------------- ---------- ---------------- ---------- ----------
    // ;GL=92.7
    // A-8              85.4       A8-A8.7          OVERFLOW   7.3        0          0          0         


    /**
     * @param {{ Elev: any; link: any; type: any; param: any; }} node
     */
    getNodeTypeString(node) {
        // console.log(node);
        let s;
        s = `節點種類：DIVIDERS<br>
        高程:${node.Elev}(m)<br>
        分水渠道:${node.link}(m)
        型態：${node.type}<br>
        參數：${node.param}
        `
        return s;
    }


    // 圓形
    // pos : 座標，例如 [24.978183645203302, 121.2640713998359];
    // zoomLevel : 16, circle radius = 10
    //             17,                 
    /**
     * @param {any} pos
     * @param {string} message
     */
    addCircle(pos, message) {
        let color = "hsl(" + 200 + ",100%, 80%)";

        var circle = L.circle(pos, {
            color: 'black',
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
     * @param {number[]} coord
     * @param {{ name: any; Elev: any; link: any; type: any; param: any; }} node
     */
    AddDivider(coord, node) {
        let s = `<h6>節點 : <strong>${node.name}</strong></h6>`;
        s += `(${coord[0].toFixed(4)},${coord[1].toFixed(4)})<br>`;
        s += this.getNodeTypeString(node);
        // 找到進出流管段名稱
        let inf_ouf = Base.get_inf_ouf(node.name);
        let i1 = inf_ouf['inf_links'].length;
        let o1 = inf_ouf['ouf_links'].length;
        s += `進流管段(${i1}):`+ inf_ouf['inf_links'].join(',');
        s += "<br>";
        s += `出流管段(${o1}):`+ inf_ouf['ouf_links'].join(',');
        this.addCircle(coord, s);
    }

    // Draw

    Draw() {
        if (this.nodes === undefined) return;
        console.log(this.nodes);
        this.nodes.forEach(node => {
            let coord = FindNodeCoord(this.coords, node.name);
            // console.log(node.name)
            let pt = [coord.lat, coord.lng];
            this.AddDivider(pt, node);
        });
    }

    // 清除DIVIDERS

    Clear() {
        if (this.Nodes != undefined && this.Nodes.length > 0) {
            for (let i = 0; i < this.Nodes.length; i++) {
                this.map.removeLayer(this.Nodes[i]);
            }
            this.Nodes = [];
        }

    }
}