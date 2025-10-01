// DrawLinks_class.js
// leaflet
// class version
// 2021-11-14
// 2025-03-20 關掉螞蟻

import { FindNodesOfLink, FindNodeCoord, FindVerticesOnLink } from "../Map2D.js";
import { FindLinkValue, IsMapFcstResUndefined } from "../MapResults/ReadMapRes.js";
import { render, html } from "../lit/lit-core.min.js";
import { GREENCOLOR, ORANGECOLOR, REDCOLOR, YELLOWCOLOR, myAlert } from "../myAlert.js";
import { getArrows } from "./ArrowHead.js";
// 計算流量
import { GetChannelHeight, GetChannelFlowArea, GetHydraulicRadius } from "./Hydraulics.js";
import { ABPTable } from "./ABPTable.js";

/**
 * @class DrawLinks
 * @description 繪製 SWMM 模型中的管線 (Links)，包括管渠、堰、孔口、抽水站等。
 */
export class DrawLinks {

    /**
     * 建立一個 DrawLinks 實例。
     * @constructor
     * @param {L.Map} map Leaflet 地圖物件。
     * @param {any[]} coords 節點座標資料。
     * @param {any[]} links 管線資料 (CONDUITS, WEIRS, ORIFICES, PUMPS)。
     * @param {any[]} vertices 管線頂點資料。
     * @param {{ Shape: string; Geom1: string | number; Geom2: number; Geom3: number, Geom4:number, Barrels: number | undefined }[]} xsections 管段斷面資料。
     * @param {any[]} transects 不規則斷面資料。
     * @param {any[]} curves 抽水機曲線資料。
     * @param {string} type 管線類型 (例如 "CONDUITS")。
     * @param {any} MapFcstRes SWMM 預報結果。
     * @param {boolean} [IsShowArrowHead=false] 是否顯示流向箭頭。
     */
    constructor(map, coords, links, vertices, xsections, transects, curves, type, MapFcstRes, IsShowArrowHead = false) {
        this.map = map;
        // [COORDINATES]
        this.coords = coords;
        // [CONDUITS]
        this.links = links;
        // [VERTICES]
        this.vertices = vertices;
        // [XSECTIONS]
        this.xsections = xsections;
        // [TRANSECTS]
        this.transects = transects;
        // [CURVES] for pumps
        this.curves = curves;
        // 物件型態文字,ex.[JUNCTIONS], [WEIRS], [ORIFICES], [PUMPS]
        this.type = type;
        // SWMM預報結果
        this.MapFcstRes = MapFcstRes;
        // 是否顯示箭頭
        this.IsShowArrowHead = IsShowArrowHead;
        // 儲存leaflet物件，清除用
        this.Conduits = [];
        // 流速方向箭頭
        this.VelArrows = new L.featureGroup();
        // 管渠總長度
        this.TotalLength = 0;
        // 逆流的管段
        this.InverseFlowLinks = [];
    }

    /**
     * 回傳渠道總長度。
     * @method GetTotalLength
     * @returns {number} 總長度。
     */
    GetTotalLength() {
        return this.TotalLength;
    }

    /**
     * 根據容量比例取得對應的顏色。
     * @method LinkColorByCapacity
     * @param {number} capacity 容量比例 (0 到 1)。
     * @returns {string} 代表顏色的字串 (例如 REDCOLOR, ORANGECOLOR, GREENCOLOR)。
     */
    LinkColorByCapacity(capacity) {
        if (Number(capacity) >= +0.99) return REDCOLOR;
        if (Number(capacity) >= +0.8) return ORANGECOLOR;
        return GREENCOLOR;
    }
    
    /**
     * 根據名稱尋找不規則斷面資料。
     * @method findTransect
     * @param {string} name 斷面名稱。
     * @returns {object | undefined} 找到的斷面物件，或 undefined。
     */
    findTransect(name) {
        let array = this.transects.filter(x => x.Name.toUpperCase() === name);
        if (array != null && array.length > 0)
            return array[0];
    }
    /**
     * 產生不規則斷面的 XY 座標 HTML 表格列。
     * @method genXYTable
     * @param {{ X: any[]; Y: any[]; }} transect 斷面物件。
     * @returns {import("../lit/lit-core.min.js").TemplateResult[]} An array of lit-html templates for table rows.
     */
    genXYTable(transect) {
        const rows = [];
        let cols = 4;
        const numRows = Math.ceil(transect.X.length / cols);
        for (let i = 0; i < numRows; i++) {
            const cells = [];
            for (let j = 0; j < cols; j++) {
                const index = i * cols + j;
                if (index >= transect.X.length) {
                    cells.push(html`<td>-</td><td>-</td>`);
                } else {
                    cells.push(html`<td>${transect.X[index]}</td><td>${transect.Y[index]}</td>`);
                }
            }
            rows.push(html`<tr>${cells}</tr>`);
        }
        return rows;
    }
    /**
     * 根據曲線名稱產生特定的抽水機曲線資料。
     * @method genPumpCurve
     * @param {string} curve_name 曲線名稱。
     * @returns {any[]} 符合名稱的曲線資料陣列。
     */
    genPumpCurve(curve_name) {
        let array = [];
        this.curves.forEach(curve => {
            if (curve.Name === curve_name)
                array.push(curve);
        });
        return array;
    }

    /**
     * 產生抽水機曲線的 HTML 表格列。
     * @method genPumpCurveTable
     * @param {any[]} array 曲線資料陣列。
     * @returns {import("../lit/lit-core.min.js").TemplateResult[]} An array of lit-html templates for table rows.
     */
    genPumpCurveTable(array) {
        const rows = [];
        let cols = 3;
        const numRows = Math.ceil(array.length / cols);

        for (let i = 0; i < numRows; i++) {
            const cells = [];
            for (let j = 0; j < cols; j++) {
                const index = i * cols + j;
                if (index >= array.length) {
                    cells.push(html`<td>-</td><td>-</td>`);
                } else {
                    cells.push(html`<td>${array[index].X_Value}</td><td>${Number(array[index].Y_Value).toFixed(0)}</td>`);
                }
            }
            rows.push(html`<tr>${cells}</tr>`);
        }
        return rows;
    }

    /**
     * 根據管線類型，取得在彈出視窗中顯示的詳細資訊字串。
     * @method getLinkTypeString
     * @param {{ Length: any; Roughness: any; Type: any; CrestHt: any; Qcoeff: any; Gated: any; Offset: any; PumpCurve: any; Status: any; Startup: any; Shutoff: any; }} link
     * @param {{ Shape: string; Geom1: string | number; Geom2: number; Geom3: number, Geom4:number, Barrels: number | undefined }} xsection 管段斷面資料。
     * @returns {import("../lit/lit-core.min.js").TemplateResult} 描述管線詳細資訊的 lit-html 模板。
     */
    getLinkTypeString(link, xsection) {
        if (this.type === "CONDUITS") {
            // 總長度
            this.TotalLength += Number(link.Length);

            let sectionDetails;
            if (xsection.Shape === "IRREGULAR") {
                // 大寫字母
                let transectName = xsection.Geom1.toUpperCase();
                let transect = this.findTransect(transectName);
                // 渠道淨高度
                let low = ABPTable.Find_Lowest(transect.Y).LowestEL;
                let high = ABPTable.Find_high(transect.Y).maxY;
                let max_depth = high - low;
                // console.log(transectName, transect);
                const tableRows = this.genXYTable(transect);
                sectionDetails = html`
                    <br>渠道淨高度=${max_depth.toFixed(2)}(m)<br>
                    <table class="table table-bordered table-hover table-sm border-dark">
                        <thead>
                            <tr class="bg-blue-100">
                                <th>X</th><th>Y</th><th>X</th><th>Y</th>
                                <th>X</th><th>Y</th><th>X</th><th>Y</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                `;
            }
            else if (xsection.Shape === "CIRCULAR") {
                sectionDetails = html`直徑:${xsection.Geom1}(m)`;
            } else {
                sectionDetails = html`底寬:${xsection.Geom2},高度:${xsection.Geom1}(m)`;
            }

            return html`, 長度:${link.Length} (m)<br>
                粗糙係數:${link.Roughness}<br>
                管段種類:${this.type}, 斷面:${xsection.Shape}
                ${sectionDetails}
            `;
        }
        else if (this.type === "WEIRS") {
            return html`型態：${link.Type}<br>
                頂部高程：${link.CrestHt}(m)<br>
                堰流係數：${link.Qcoeff}<br>
                閘門：${link.Gated}<br>
                管段種類:${this.type}
            `;
        } else if (this.type === "ORIFICES") {
            return html`型態：${link.Type}<br>
                Offset: ${link.Offset}<br>
                流量係數: ${link.Qcoeff}<br>
                閘門": ${link.Gated}<br>
                管段種類:${this.type}
            `;
        } else if (this.type === "PUMPS") {

            let pump = this.genPumpCurve(link.PumpCurve);
            // console.log(pump[0].Type);
            let pumpCurveType = pump[0].Type;

            const tableRows = this.genPumpCurveTable(pump);
            return html` 管段種類:${this.type}<br>
                狀態: ${link.Status}<br>
                啟動: ${link.Startup}, Shutoff: ${link.Shutoff}<br>
                抽水曲線: ${link.PumpCurve}, 曲線型態:${pumpCurveType}<br>
                <table class="table table-bordered table-hover table-sm border-dark">
                    <thead>
                        <tr class="bg-blue-100">
                            <th>X</th><th>Y</th><th>X</th><th>Y</th>
                            <th>X</th><th>Y</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        }
        return html``;
    }

    /**
     * 根據管線名稱尋找其斷面資料。
     * @method FindXSection
     * @param {string} linkName 管線名稱。
     * @returns {object} 找到的斷面物件。
     */
    FindXSection(linkName) {
        let result = this.xsections.filter(x => x.Link === linkName);
        if (result.length > 0)
            return result[0];
        else
            return {
                "Link": linkName,
                "Shape": null,
                "Geom1": null,
                "Geom2": null,
                "Geom3": null,
                "Geom4": null,
                "Barrels": null
            };
    }

    /**
     * 根據起點、終點和中間頂點生成 Leaflet Polyline 所需的座標陣列。
     * @method GenPolyline
     * @param {{ lat: any; lng: any; }} FromPoint 管渠起點座標
     * @param {{ lat: any; lng: any; }} ToPoint 管渠終點座標
     * @param {{lat: number, lng: number}[]} verticesPoints 管渠中間頂點座標陣列。
     * @returns {[number,number][]} PolyLine
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
     * 根據 SWMM 管段模擬結果生成 HTML 表格。
     * @method GenLinkResTable
     * @param {{Id: string, Depth: number, Velocity: number, Flow: number, Capacity: number}} LinkRes - SWMM 管段模擬結果。
     * @returns {import("../lit/lit-core.min.js").TemplateResult} 顯示結果的 lit-html 模板。
     */
    GenLinkResTable(LinkRes) {
        const { Depth, Velocity, Flow, Capacity } = LinkRes;
        return html`
            <strong>預報產製:${this.MapFcstRes.InitTime}</strong>, <strong>預報時間:${this.MapFcstRes.FcstTime}</strong>
            <table class="table table-bordered table-hover table-sm border-dark">
                <thead>
                    <tr class="bg-blue-100">
                        <th>水深(M)</th>
                        <th>流速(M/S)</th>
                        <th>流量(CMS)</th>
                        <th>容量(0~1)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${Depth.toFixed(2)}</td><td>${Velocity.toFixed(2)}</td><td>${Flow.toFixed(2)}</td><td>${Capacity.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>`;
    }
    /**
     * 生成CONDUIT:進出口高程; WEIR:CrestHt, Qcoeff;
     * @param {{ name: string; From: string; To: string; 
    *           Length: number; Roughness: number; 
    *           InOffset:number, OutOffset:number,
    *           Type: any; CrestHt?: any; Qcoeff: number; 
    *           Gated: any; Offset: any; PumpCurve: any; 
     *          Status: any; Startup: any; Shutoff: any; }} link 管線物件。
     * @returns {import("../lit/lit-core.min.js").TemplateResult} 顯示進出口高程和坡度的 lit-html 模板。
     */
    GenLinkInOutOffset(link) {
        if (this.type === "CONDUITS") {
            let slope = (link.InOffset - link.OutOffset) / link.Length;
            return html`進口高程:${link.InOffset}(m), 出口高程:${link.OutOffset}(m), 坡度：${slope.toFixed(4)}<br>`;
        } else return html``;
    }
    /**計算管渠通水能力
     * @param {{ name: string; From: string; To: string; 
    *           Length: number; Roughness: number; 
    *           InOffset:number, OutOffset:number,
    *           Type: any; CrestHt?: any; Qcoeff: number; 
    *           Gated: any; Offset: any; PumpCurve: any; 
    *          Status: any; Startup: any; Shutoff: any; }} link
    * @param {{ Shape: string; Geom1: string | number; Geom2: number; Geom3: number, Geom4:number,
     *           Barrels: number | undefined }} xsection 管段斷面資料。
     * @returns {number} 重力流的最大流量 (CMS)。若管渠為逆坡度則回傳 -1。
     *  */
    CalFlowCapacity(link, xsection) {
        // flow capacity in cms
        let flow_capacity = +0;
        if (this.type === "CONDUITS") {

            let Roughness = link.Roughness;
            // 計算最大均勻流量

            // 斷面, xsection.Shape = ['RECT_CLOSED', 'CIRCULAR', 'RECT_OPEN', 'TRAPEZOIDAL', 'IRREGULAR']

            // console.warn(`規則斷面管渠, xsection.Shape=${xsection.Shape}`);
            // 管渠縱坡度
            let slope = (link.InOffset - link.OutOffset) / link.Length;
            if (slope < 0) {
                return -1;
            }
            // 取得渠道最大高度 (m)
            let ChannelHeight = GetChannelHeight(xsection);
            // 水深 = 0.9 * 渠道高度 (m)
            let depth = 0.9 * ChannelHeight;
            // 通水面積 (m^2)
            let FlowArea = GetChannelFlowArea(xsection, depth);
            // 水力半徑
            let HydraulicRadius = GetHydraulicRadius(xsection, depth);
            let K = 1.0 / Roughness * FlowArea * Math.pow(HydraulicRadius, 0.667);
            // 曼寧公式
            flow_capacity = K * Math.pow(slope, 0.5);
            // console.log('---', link.name, Roughness, depth, FlowArea, HydraulicRadius, K, flow_capacity);
            return flow_capacity;
        } else {
            console.warn(`非管渠, xsection.Shape=${xsection.Shape}`);
            return +0;
        }
    }

    /**
     * 繪製管渠斷面圖。
     * @static
     * @param {object} xsection - 管段斷面資料。
     * @param {any[]} allTransects - 所有的不規則斷面資料陣列 (僅在 xsection.Shape 為 IRREGULAR 時需要)。
     * @param {string} elementId - 要插入圖表的目標 HTML 元素的 ID。
     */
    static DrawXSectionChart(xsection, allTransects, elementId) {
        const plotContainer = document.getElementById(elementId);
        if (!plotContainer) {
            console.error(`Element with id "${elementId}" not found for plotting.`);
            return;
        }

        let plotData = [];
        const chartTitle = `${xsection.Link} 斷面圖 (${xsection.Shape})`;

        switch (xsection.Shape) {
            case "IRREGULAR": {
                const transect = allTransects.find(t => t.Name.toUpperCase() === xsection.Geom1.toUpperCase());
                if (transect && transect.X && transect.Y) {
                    plotData = transect.X.map((x, i) => [parseFloat(x), parseFloat(transect.Y[i])]);
                }
                break;
            }
            case "CIRCULAR": {
                const diameter = parseFloat(xsection.Geom1);
                const radius = diameter / 2;
                for (let i = 0; i <= 360; i += 5) {
                    const angle = i * (Math.PI / 180);
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle) + radius; // y-axis starts from bottom
                    plotData.push([x, y]);
                }
                break;
            }
            case "RECT_CLOSED": {
                const height = parseFloat(xsection.Geom1);
                const width = parseFloat(xsection.Geom2);
                const halfWidth = width / 2;
                plotData = [
                    [-halfWidth, 0], [-halfWidth, height], [halfWidth, height], [halfWidth, 0], [-halfWidth, 0]
                ];
                break;
            }
            case "RECT_OPEN": {
                const height = parseFloat(xsection.Geom1);
                const width = parseFloat(xsection.Geom2);
                const halfWidth = width / 2;
                // 向上開口，所以從左上角開始繪製
                plotData = [
                    [-halfWidth, height], [-halfWidth, 0], [halfWidth, 0], [halfWidth, height]
                ];
                break;
            }
            case "TRAPEZOIDAL": {
                const bottomWidth = parseFloat(xsection.Geom1);
                const height = parseFloat(xsection.Geom2);
                const leftSlope = parseFloat(xsection.Geom3);
                const rightSlope = parseFloat(xsection.Geom4);
                const halfBottom = bottomWidth / 2;
                const topLeftX = -halfBottom - (height * leftSlope);
                const topRightX = halfBottom + (height * rightSlope);
                // 向上開口
                plotData = [
                    [topLeftX, height], [-halfBottom, 0], [halfBottom, 0], [topRightX, height]
                ];
                break;
            }
            default:
                plotContainer.innerHTML = `<p class="text-danger">尚不支援繪製 ${xsection.Shape} 斷面圖。</p>`;
                return;
        }

        if (plotData.length === 0) {
            plotContainer.innerHTML = "<p>無斷面圖資料可繪製。</p>";
            return;
        }

        const $plotContainer = $(plotContainer);
        const $chartDiv = $('<div style="width:100%;height:180px;"></div>');
        const $card = $(`
            <div class="card mt-2 border-secondary">
                <div class="card-header bg-primary text-light p-2">${chartTitle}</div>
                <div class="card-body p-1"></div>
            </div>
        `);

        $card.find('.card-body').append($chartDiv);
        $plotContainer.empty().append($card);

        const plotOptions = {
            series: { lines: { show: true, lineWidth: 2 }, points: { show: xsection.Shape === 'CIRCULAR' } },
            grid: { hoverable: true, borderColor: '#CCC', borderWidth: 1 },
            yaxis: { autoscaleMargin: 0.15 },
            tooltip: { show: true, content: "x: %x.2 m, y: %y.2 m" }
        };

        const plotWhenReady = () => {
            let attempts = 0;
            const maxAttempts = 50; // 50 * 50ms = 2.5s timeout
            const checkAndPlot = () => {
                if ($chartDiv.width() > 0) {
                    try {
                        $.plot($chartDiv, [plotData], plotOptions);
                    } catch (e) {
                        console.error("An error occurred while plotting the x-section chart:", e);
                        $chartDiv.text(`繪製圖表時發生錯誤: ${e.message}`);
                    }
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkAndPlot, 50);
                } else {
                    console.error("Flot container for x-section failed to get dimensions.", $chartDiv);
                    $chartDiv.text("無法繪製圖表：容器尺寸錯誤。");
                }
            };

            if (typeof $.plot !== 'function') {
                $chartDiv.text('圖表函式庫 (Flot) 未載入。');
            } else {
                checkAndPlot();
            }
        };

        plotWhenReady();
    }
    /**
     * 將單一管線繪製到地圖上。
     * @method AddCouduitPolyLine
     * @param {[number,number][]} latlngs 管線的 Leaflet 座標陣列。
     * @param {{ name: any; From: any; To: any; 
     *           Length: any; Roughness: any; 
     *           InOffset:number, OutOffset:number,
     *           Type: any; CrestHt?: any; Qcoeff: any; 
     *           Gated: any; Offset: any; PumpCurve: any; 
     *          Status: any; Startup: any; Shutoff: any; }} link 管線物件。
     * @param {{ Shape: string; Geom1: string | number; Geom2: number; Geom3: number, Geom4:number,
     *           Barrels: number | undefined }} xsection 管段斷面資料。
     * @param {{ Id: string, Depth: number, Velocity: number, Flow: number, Capacity: number } | undefined} LinkRes SWMM 管段模擬結果。
     * @param {boolean} [IsDrawArrows=true] 是否繪製流向箭頭。
     */
    AddCouduitPolyLine(latlngs, link, xsection, LinkRes, IsDrawArrows = true) {

        let color = '#555';
        let IsVelPositive = true;

        // Create a container for the tooltip content
        const tooltipContainer = document.createElement('div');

        // Get all parts of the message as templates
        const title = html`<h6>管段 : <strong>${link.name}</strong></h6>`;
        const resTable = (LinkRes && LinkRes.Id !== undefined) ? this.GenLinkResTable(LinkRes) : html``;
        const typeString = this.getLinkTypeString(link, xsection);
        const inOutOffset = this.GenLinkInOutOffset(link);
        const flowCapacity = this.CalFlowCapacity(link, xsection);
        const capacityString = +flowCapacity > +0
            ? html`<strong>通水能力=${flowCapacity.toFixed(2)}(cms)</strong>`
            : html`<span class='w3-red p-1'>逆坡度!</span>`;

        // 新增繪圖按鈕和圖表容器的模板
        let chartButton = html``;
        if (this.type === "CONDUITS") {
            const chartContainerId = `link-chart-${link.name}`;
            const drawButtonId = `draw-chart-btn-${link.name}`;
            chartButton = html`
                <button id="${drawButtonId}" class="btn btn-sm btn-primary mt-1">繪製斷面圖</button>
                <div id="${chartContainerId}" class="mt-2"></div>
            `;
        }

        // 如果有預報結果，則更新顏色、流向和彈出訊息
        if (LinkRes && LinkRes.Id !== undefined) {
            // 決定顏色
            color = this.LinkColorByCapacity(LinkRes.Capacity);

            // 決定箭頭方向
            IsVelPositive = LinkRes.Velocity >= 0;
        }

        // Compose the final template
        const messageTemplate = html`
            ${title}
            ${resTable}
            起點：${link.From}, 終點：${link.To}${typeString}<br>
            ${inOutOffset}
            ${capacityString}
            ${chartButton}
        `;

        // Render the template into the container
        render(messageTemplate, tooltipContainer);

        // 如果流速為負值 則倒轉串列
        if (!IsVelPositive) {
            this.InverseFlowLinks.push(link.name);
            latlngs.reverse();
        }

        let polyline;
        if (color === GREENCOLOR)
            polyline = L.polyline(latlngs, {
                color: color,
                fillColor: color,
                weight: 2
            });
        else
            polyline = L.polyline(latlngs, {
                color: color,
                fillColor: color,
                weight: 3
            });

        polyline.bindPopup(tooltipContainer, { maxWidth: 400 });

        // 當彈出視窗打開時，為繪圖按鈕加上事件監聽
        if (this.type === "CONDUITS") {
            polyline.on('popupopen', () => {
                const drawButtonId = `draw-chart-btn-${link.name}`;
                const chartContainerId = `link-chart-${link.name}`;
                const drawButton = document.getElementById(drawButtonId);
                const allTransects = this.transects; // 捕獲 transects

                if (drawButton) {
                    drawButton.addEventListener('click', () => {
                        DrawLinks.DrawXSectionChart(xsection, allTransects, chartContainerId);
                        // 繪製後可以禁用按鈕，避免重複繪製
                        drawButton.disabled = true;
                        drawButton.innerText = '斷面圖已繪製';
                    });
                }
            });
        }

        // polyline存起來
        this.Conduits.push(polyline);

        // polyline加到地圖
        this.map.addLayer(polyline);

    }

    /**
     * 繪製所有管線到地圖上。
     * @method Draw
     * @returns {void}
     */
    Draw = () => {

        // 逆流的管段名稱串列
        this.InverseFlowLinks = [];
        // 是否繪製箭頭
        let IsDrawArrows = (this.map.getZoom() > 16) && this.IsShowArrowHead;

        this.VelArrows.clearLayers();

        // Add All Links
        for (let i = 0; i < this.links.length; i++) {
            let linkName = this.links[i].name;
            let node12 = FindNodesOfLink(this.links, linkName);
            let ptFrom = FindNodeCoord(this.coords, node12[0]);
            let ptTo = FindNodeCoord(this.coords, node12[1]);

            let verticPoint = FindVerticesOnLink(this.vertices, linkName);

            // 組合成完整線條
            let latlngs = this.GenPolyline(ptFrom, ptTo, verticPoint);

            // 找到管段的斷面[XSECTIONS]
            let xsection = this.FindXSection(this.links[i].name);
            // this.AddCouduitPolyLine(latlngs, this.links[i], xsection);
            // 找到SWMM預報結果
            let linkRes;
            if (!IsMapFcstResUndefined()) {
                linkRes = FindLinkValue(linkName);
            }

            if (linkRes === null)
                this.AddCouduitPolyLine(latlngs, this.links[i], xsection, undefined, IsDrawArrows);
            else
                this.AddCouduitPolyLine(latlngs, this.links[i], xsection, linkRes, IsDrawArrows);
        }

        // ZOOM全部範圍
        // this.map.fitBounds(this.Conduits.getBounds());

        // if (this.InverseFlowLinks.length > 0) {
        //     // 通知逆流管段
        //     let InverseFlowInfo = `逆流管段數:${this.InverseFlowLinks.length}`;
        //     myAlert(InverseFlowInfo, OrangeCOlor, 5000)
        //     console.warn(InverseFlowInfo);
        // }
    }

    /**
     * 清除地圖上所有已繪製的管線和箭頭。
     * @method Clear
     * @returns {void}
     */
    Clear() {
        // 迭代並移除地圖上的每個管線圖層
        for (const conduit of this.Conduits) {
            this.map.removeLayer(conduit);
        }
        this.Conduits = []; // 清空管線陣列
        this.map.removeLayer(this.VelArrows);
        // 清除流速方向箭頭
        this.VelArrows.clearLayers();
    }

}