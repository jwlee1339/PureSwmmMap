// StorageCurve.js
// 2021-11-15
// 滯洪池HV曲線列表


/**
 * @class StorageCurve
 * @description 用於處理和顯示滯洪池（蓄水池）及其相關曲線資料的類別。
 */
export class StorageCurve {
    /**
     * 建立一個 StorageCurve 實例。
     * @constructor
     * @param {Array<object>} storages - 滯洪池物件的陣列。
     * @param {Array<object>} curves - 滯洪池曲線資料的陣列。
     */
    constructor(storages, curves) {
        this.storages = storages;
        this.curves = curves;
    }

    /**
     * 根據曲線名稱從 `this.curves` 中篩選出特定的滯洪池曲線資料。
     * @method genStorageCurve
     * @param {string} curve_name - 要篩選的曲線名稱。
     * @returns {Array<object>} - 符合名稱的曲線資料陣列。
     */
    genStorageCurve(curve_name) {
        let array = [];
        this.curves.forEach(curve => {
            if (curve.Name === curve_name)
                array.push(curve);
        });
        return array;
    }

    /**
     * 在指定的 HTML 元素中產生並顯示滯洪池主表的 HTML。
     * @method GenMainTable
     * @param {string} elementId - 要插入表格的目標 HTML 元素的 ID。
     * @returns {void}
     */
    GenMainTable(elementId) {
        if (this.storages == null || this.storages.length == 0) {
            document.getElementById(elementId).innerHTML = "<p>無滯洪池資料</p>";
            return;
        }

        let tr = "";
        this.storages.forEach(storage => {
            let td = `<td class="storage-click" curve-name='${storage.CurveName}'>${storage.name}</td>`;
            td += `<td>${storage.Elev}</td>`;
            td += `<td>${storage.InitDepth}</td>`;
            td += `<td>${storage.MaxDepth}</td>`;
            td += `<td>${storage.CurveName}</td>`;
            td += `<td>${storage.Shape}</td>`;
            tr += `<tr>${td}</tr>`;
        });

        let html = `
        <div class="card mt-2">
            <div class="card-header bg-blue-600 p-2">
				<span class="text-light">滯洪池總表</span>
			</div>
            <div class="card-body p-2">
                <div class="table-responsive">
                    <table class="table table-bordered table-hover table-sm border-dark">
                        <thead>
                            <tr class="bg-blue-100">
                                <th>名稱</th>
                                <th>底部高程(m)</th>
                                <th>初始水深(m)</th>
                                <th>最大水深(m)</th>
                                <th>曲線名稱</th>
                                <th>曲線型態</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tr}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        document.getElementById(elementId).innerHTML = html;

        const user_clicked = document.getElementsByClassName("storage-click");
        const self = this; // 捕獲 StorageCurve 實例的 'this'

        for (let i = 0; i < user_clicked.length; i++) {
            user_clicked[i].addEventListener('click', function () {
                const curveName = this.getAttribute('curve-name');
                const curveData = self.genStorageCurve(curveName);

                // 假設頁面上有 'Storage-DA-Table' 和 'Storage-DA-Chart' 的元素
                // 這些 ID 應該在呼叫此方法的 HTML 頁面中定義
                if (document.getElementById("Storage-DA-Table")) {
                    StorageCurve.GenDepthAreaTable(curveData, "Storage-DA-Table");
                }
                const chartContainer = document.getElementById("Storage-DA-Chart");
                if (chartContainer) {
                    chartContainer.innerHTML = ""; // 清除舊圖表
                }
            });
        }
    }

    /**
     * (靜態方法) 在指定的 HTML 元素中產生並顯示滯洪池水深與面積表的 HTML。
     * @static
     * @method GenDepthAreaTable
     * @param {Array<object>} curves - 用於產生表格的曲線資料陣列。
     * @param {string} elementId - 要插入表格的目標 HTML 元素的 ID。
     * @returns {void}
     */
    static GenDepthAreaTable(curves, elementId) {
        if (curves == null || curves.length == 0) {
            document.getElementById(elementId).innerHTML = "<p>無水深面積資料</p>";
            return;
        }
        let tr = "";
        const drawButtonId = `${elementId}-draw-btn`;

        curves.forEach(curve => {
            let td = `<td>${curve.Name}</td>`;
            td += `<td>${curve.Type}</td>`;
            td += `<td>${curve.X_Value}</td>`;
            td += `<td>${curve.Y_Value}</td>`;
            tr += `<tr>${td}</tr>`;
        });

        let html = `
        <div class="card mt-2">
            <div class="card-header bg-blue-600 p-2 d-flex justify-content-between align-items-center">
                <span class="text-light">水深面積對照表</span>
                <button id="${drawButtonId}" class="btn btn-sm btn-outline-light">
                    <i class="fa fa-chart-area"></i> 繪製圖表
                </button>
			</div>
            <div class="card-body p-2">
                <div class="table-responsive">
                    <table class="table table-bordered table-hover table-sm border-dark">
                        <thead>
                            <tr class="bg-blue-100">
                                <th>名稱</th>
                                <th>型式</th>
                                <th>X_Value(m)</th>
                                <th>Y_Value(m^2)</th>
                            </tr>
                        </thead>
                        <tbody>${tr}</tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        const targetElement = document.getElementById(elementId);
        if (!targetElement) {
            return;
        }
        targetElement.innerHTML = html;

        document.getElementById(drawButtonId).addEventListener('click', () => {
            const chartContainerId = "Storage-DA-Chart";
            // 假設頁面上有 'Storage-DA-Chart' 的元素
            StorageCurve.Draw(curves, chartContainerId);
        });
    }

    /**
     * (靜態方法) 使用 Flot.js 在指定的 HTML 元素中繪製滯洪池水深與面積圖。
     * @static
     * @method Draw
     * @param {Array<object>} curves - 用於繪製圖表的曲線資料陣列。
     * @param {string} elementId - 要插入圖表的目標 HTML 元素的 ID。
     * @returns {void}
     */
    static Draw(curves, elementId) {
        const plotContainer = document.getElementById(elementId);
        if (!plotContainer) {
            console.error(`Element with id "${elementId}" not found for plotting.`);
            return;
        }

        if (curves == null || curves.length == 0) {
            plotContainer.innerHTML = "<p>無圖表資料</p>";
            return;
        }

        // 取得曲線名稱作為圖表標題
        const curveName = curves.length > 0 ? curves[0].Name : "滯洪池";
        const chartTitle = `${curveName} 水深面積曲線圖`;

        // 建立圖表卡片結構
        const $plotContainer = $(plotContainer);
        const $chartDiv = $('<div style="width:100%;height:180px;"></div>');
        const $card = $(`
            <div class="card mt-2">
                <div class="card-header bg-blue-600 p-2">
                    <span class="text-light">${chartTitle}</span>
                </div>
                <div class="card-body p-2">
                </div>
            </div>
        `);

        $card.find('.card-body').append($chartDiv);
        $plotContainer.empty().append($card);

        // 準備 Flot 所需的資料格式 [[x1, y1], [x2, y2], ...]
        const plotData = curves.map(curve => [parseFloat(curve.X_Value), parseFloat(curve.Y_Value)]);

        // Flot 圖表選項
        const plotOptions = {
            series: {
                lines: { show: true, lineWidth: 2 },
                points: { show: true, radius: 3 }
            },
            grid: {
                hoverable: true,
                clickable: true,
                borderColor: '#333',
                borderWidth: 1
            },
            xaxis: {},
            yaxis: {},
            tooltip: {
                show: true,
                content: "水深: %x.2 (m), 面積: %y.2 (m²)"
            },
            legend: {
                show: true,
                position: "nw", // 圖例位置：西北 (ne, nw, se, sw)
                margin: [10, 10],
                backgroundColor: "#FFF",
                backgroundOpacity: 0.7
            }
        };

        /**
         * 由於圖表容器是動態加入到 DOM 中 (特別是在 Leaflet 的 Popup 內)，
         * 瀏覽器需要一點時間來渲染並計算其尺寸。
         * Flot 繪圖需要容器有明確的寬和高，否則會失敗。
         * 此函式會重複檢查容器尺寸，直到它大於 0，然後才執行繪圖。
         */
        const plotWhenReady = () => {
            let attempts = 0;
            const maxAttempts = 50; // 最多嘗試 50 次 (50 * 50ms = 2.5s)

            const checkAndPlot = () => {
                if ($chartDiv.width() > 0 && $chartDiv.height() > 0) {
                    try {
                        $.plot($chartDiv, [{ data: plotData, label: "水深面積曲線" }], plotOptions);
                    } catch (e) {
                        console.error("An error occurred while plotting the chart:", e);
                        $chartDiv.text(`繪製圖表時發生錯誤: ${e.message}`);
                    }
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkAndPlot, 50); // 50ms 後再試一次
                } else {
                    console.error("Flot container failed to get dimensions after several attempts.", $chartDiv);
                    $chartDiv.text("無法繪製圖表：容器尺寸錯誤。");
                }
            };

            if (typeof $.plot !== 'function') {
                console.error('Flot library is not loaded or $.plot is not a function.');
                $chartDiv.text('圖表函式庫 (Flot) 未載入。');
            } else {
                checkAndPlot();
            }
        };

        plotWhenReady();
    }
}

/*
Storage :
[
{
    CurveName: "S01"
    Elev: 1.2
    InitDepth: 0
    MaxDepth: 5.3
    Shape: "TABULAR"
    name: "Sto-S"
}
]

Curve
[{
Name: "S01"
Type: "Storage"
X_Value: "0"
Y_Value: "42048.804"
},
{
Name: "S01"
Type: "Storage"
X_Value: "0.8"
Y_Value: "113733.616"
},
{
Name: "S01"
Type: "Storage"
X_Value: "5.3"
Y_Value: "137901.341"
},
{
    Name: "N01"
Type: "Storage"
X_Value: "0"
Y_Value: "15002.386"
},
{
Name: "N01"
Type: "Storage"
X_Value: "0"
Y_Value: "15002.386"
}
]
*/
