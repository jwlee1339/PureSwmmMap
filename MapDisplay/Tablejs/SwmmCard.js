// SwmmCard.js
// 2023-12-08
// 統計總表
// 使用這個類

import { render, html } from "../lit/lit-core.min.js";

/**
 * @class SwmmCard
 * @description 呈現 SWMM 模型的統計資訊卡片。
 */
export class SwmmCard {
    /**
   * 建立一個 SwmmCard 實例。
   * @constructor
   * @param {HTMLElement} container
   */
    constructor(container) {
        this.container = container;
        // 展示或消除SWMM物件統計表
        this.table_title_show = true;
    }

    /**
     * 根據傳入的 JSON 資料產生統計數據的 HTML 表格列。
     * @method ShowNumbers
     * @param {object} json - 包含 SWMM 物件統計數據的物件。
     * @param {number} json.NSubcatchments - 子集水區數量。
     * @param {number} json.TotalArea - 子集水區總面積。
     * @param {number} json.NConduites - 管渠數量。
     * @param {number} json.TotalLength - 管渠總長度。
     * @param {number} json.NPumps - 抽水站數量。
     * @param {number} json.NOrifices - 孔口數量。
     * @param {number} json.NWeirs - 攔水堰數量。
     * @param {number} json.NJunctions - 人孔數量。
     * @param {number} json.NOutfalls - 排放口數量。
     * @param {number} json.NStorage - 儲存設施數量。
     * @returns {import("../lit/lit-core.min.js").TemplateResult} - 代表表格列的 lit-html 模板。
     */
    ShowNumbers(json) {
        // console.log(json);
        let tr;
        tr = html`
             <tr><td>子集水區數</td><td>${json.NSubcatchments}</td></tr>
             <tr><td>子集水區總面積(公頃)</td><td>${json.TotalArea.toFixed(0)}</td></tr>
             <tr><td>管渠數</td><td>${json.NConduites}</td></tr>
             <tr><td>管渠總長度(公尺)</td><td>${json.TotalLength.toFixed(0)}</td></tr>
             <tr><td>抽水站數</td><td>${json.NPumps}</td></tr>
             <tr><td>孔口數</td><td>${json.NOrifices}</td></tr>
             <tr><td>攔水堰數</td><td>${json.NWeirs}</td></tr>
             <tr><td>人孔數</td><td>${json.NJunctions}</td></tr>
             <tr><td>出水口數</td><td>${json.NOutfalls}</td></tr>
             <tr><td>滯洪池數</td><td>${json.NStorage}</td></tr>
             `
        return tr;
    }

    /**
     * 處理點擊事件，用來顯示或隱藏統計表主體，並更新標題圖示和樣式。
     * @method handleShowTable
     * @returns {void}
     */
    handleShowTable() {
        this.table_title_show = !this.table_title_show;
        const summaryBody = document.getElementById('swmm-summary-body');
        const tableTitle = document.getElementById('table-title');

        if (!summaryBody || !tableTitle) {
            return;
        }

        if (this.table_title_show) {
            // 隱藏 (收合)
            summaryBody.style.maxHeight = null;

            tableTitle.style.color = "white";
            tableTitle.innerHTML = `<i class="fa fa-plus"></i> Swmm物件統計表`;
        } else {
            // 顯示 (展開)
            summaryBody.style.maxHeight = summaryBody.scrollHeight + "px";

            tableTitle.style.color = "yellow";
            tableTitle.innerHTML = `<i class="fa fa-minus"></i> Swmm物件統計表`;
        }
    }
    /**
     * 渲染整個 SWMM 統計卡片到指定的容器中。
     * @method Render
     * @param {object} json - 包含 SWMM 物件統計數據的物件。
     * @param {number} json.NSubcatchments - 子集水區數量。
     * @param {number} json.TotalArea - 子集水區總面積。
     * @param {number} json.NConduites - 管渠數量。
     * @param {number} json.NWeirs - 攔水堰數量。
     * @param {number} json.NOrifices - 孔口數量。
     * @param {number} json.NPumps - 抽水站數量。
     * @param {number} json.TotalLength - 管渠總長度。
     * @param {number} json.NJunctions - 人孔數量。
     * @param {number} json.NOutfalls - 排放口數量。
     * @param {number} json.NStorage - 儲存設施數量。
     */
    Render(json) {
        let css = html`
        <style>
            /* 統計表內容 */
            #swmm-card {
                position: absolute;
                z-index: 410;
                right: 120px;
                bottom: 20px;
            }
            /* 預設為不顯示，並加入轉場動畫效果 */
            #swmm-summary-body{
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.2s ease-in-out;
            }
            /* Swmm物件統計表 */
            #table-title{
                cursor: pointer;
                color: #eee;
            }
        </style>
        `;

        let table = html`
            <div class="table-responsive">
                <table class="table table-striped table-sm table-bordered table-hover text-center border-dark table-condensed">
                    <thead>
                        <tr><th>項目</th><th>統計</th></tr>
                    </thead>
                    <tbody>${this.ShowNumbers(json)}</tbody>
                </table>
            </div>`;

        let content = html`
          ${css}
          <div id="swmm-card" class="card shadow">
                <div class="card-header text-center bg-info p-1">
                    <span id="table-title" 
                        @click=${() => this.handleShowTable()}>
                        <i class="fa fa-plus"></i> Swmm物件統計表
                    </span>
                </div>

                <div id="swmm-summary-body" class="card-body p-1">
                  ${table}
                </div>

          </div>
        `;
        render(content, this.container);
    }
}
