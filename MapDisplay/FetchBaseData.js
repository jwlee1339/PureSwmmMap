'use strict';

/**
 * @typedef {object} SwmmCoordinatePoint
 * @property {number} x_97 - TWD97 X 座標。
 * @property {number} y_97 - TWD97 Y 座標。
 * @property {number} lng - 經度 (Longitude)。
 * @property {number} lat - 緯度 (Latitude)。
 */

/**
 * @typedef {object} SwmmDimensions
 * @property {SwmmCoordinatePoint} left_down - 地圖邊界左下角座標。
 * @property {SwmmCoordinatePoint} right_up - 地圖邊界右上角座標。
 * @property {string} Units - 地圖單位。
 */

/**
 * @typedef {object} SwmmCoordinate
 * @property {string} name - 節點名稱。
 * @property {number} x_97 - TWD97 X 座標。
 * @property {number} y_97 - TWD97 Y 座標。
 * @property {number} lng - 經度。
 * @property {number} lat - 緯度。
 */

/**
 * @typedef {object} SwmmJunction
 * @property {string} name - 節點名稱。
 * @property {number} Elevation - 地面高程。
 * @property {number} MaxDepth - 最大深度。
 * @property {number} InitDepth - 初始水深。
 * @property {number} SurDepth - 溢淹深度。
 * @property {number} Aponded - 積水面積。
 */

/**
 * @typedef {object} SwmmOutfall
 * @property {string} name - 放流口名稱。
 * @property {number} Elevation - 高程。
 * @property {string} Type - 類型 (e.g., "NORMAL", "FIXED")。
 * @property {string|number} StageData - 水位資料。
 * @property {string} Gated - 是否有閘門 ("YES" or "NO")。
 */

/**
 * @typedef {object} SwmmConduit
 * @property {string} name - 管渠名稱。
 * @property {string} From - 起始節點。
 * @property {string} To - 結束節點。
 * @property {number} Length - 長度。
 * @property {number} Roughness - 曼寧糙度係數。
 * @property {number} InOffset - 入口高程。
 * @property {number} OutOffset - 出口高程。
 * @property {number} InitFlow - 初始流量。
 * @property {number} MaxFlow - 最大流量。
 */

/**
 * @typedef {object} SwmmXSection
 * @property {string} Link - 管渠名稱。
 * @property {string} Shape - 斷面形狀 (e.g., "RECT_CLOSED", "CIRCULAR")。
 * @property {number|string} Geom1 - 幾何參數1。
 * @property {number|string} Geom2 - 幾何參數2。
 * @property {number|string} Geom3 - 幾何參數3。
 * @property {number|string} Geom4 - 幾何參數4。
 * @property {number} Barrels - 管數。
 */

/**
 * @typedef {object} SwmmSubcatchment
 * @property {string} Name - 集水分區名稱。
 * @property {string} RainGage - 雨量站。
 * @property {string} Outlet - 出流口。
 * @property {string} Area - 面積。
 * @property {string} Imperv - 不透水區百分比。
 * @property {string} Width - 寬度。
 * @property {string} Slope - 坡度。
 */
/**
 * @typedef {object} SwmmSubarea
 * @typedef {string} Subcatchment - 集水區名稱
 * @typedef {string} N_Imperv - 不透水區粗糙係數
 * @typedef {string} N_Perv - 透水區粗糙係數
 * @typedef {string} S_Imperv - 不透水區漥蓄容量(公尺)
 * @typedef {string} S_Perv - 透水區漥蓄容量(公尺)
 * @typedef {string} PctZero - "25",
 * @typedef {string} RouteTo - 流出類型
 */
/**
 * @typedef {object} SwmmInfil
 * @property {string} Subcatchment - 名稱
 * @property {number} MaxRate - 初始入滲率
 * @property {number} MinRate - 長期入滲率
 * @property {number} Decay - 衰減係數
 * @property {number} DryTime - 返回初始入滲率的日數
 * @property {number} MaxInfil - 最大入滲量
 */
/**
 * @typedef {object} SwmmPump
 * @property {string} name - 抽水機名稱
 * @property {string} From - 進水節點
 * @property {string} To - 出水節點
 * @property {PumpCurve} PumpCurve - 抽水機特性曲線名稱
 * @property {string} Status - 狀態 
 * @property {number} Startup - 起抽水位
 * @property {number} Shutoff - 關閉水位
 */
/**
 * @typedef {object} SwmmWeir
 * @typedef {string} name - 攔河堰名稱
 * @typedef {string} From - 進水節點
 * @typedef {string} To - 出水節點
 * @typedef {string} Type - 型態
 * @typedef {number} CrestHt - 堰頂高程
 * @typedef {number} Qcoeff - 堰流係數
 * @typedef {string} Gated - 有否閘門
 */
/**
 * @typedef {object} SwmmOrifice
 * @typedef {string} name - 孔口名稱
 * @typedef {string} From - 進水節點
 * @typedef {string} To - 出水節點
 * @typedef {string} Type - 型態
 * @typedef {number} Offset - 孔口底部高程
 * @typedef {number} Qcoeff - 孔口係數
 * @typedef {string} Gated - 有否閘門
 * @typedef {number} CloseTime - 關閉時間
 */
/**
 * @typedef {object} SwmmStorage
 * @property {string} name - 名稱
 * @property {number} Elev - 底部高程
 * @property {number} MaxDepth - 最大水深
 * @property {number} InitDepth - 初始水深
 * @property {string} Shape - 水深體積表型態
 * @property {string} CurveName - 水深體積表名稱
 */
/**
 * @typedef {object} SwmmCurve
 * @property {string} Name - 名稱
 * @property {string} Type - 種類
 * @property {number} X_Value - x 數值
 * @property {number} Y_Value - y 數值
 * */

/**
 * @typedef {object} SwmmBaseData - SWMM 專案的基礎圖資結構。
 * @property {string} ProjectId - 專案 ID。
 * @property {string} InpFile - SWMM 輸入檔 (.inp) 的路徑。
 * @property {SwmmDimensions} DIMENSIONS [DIMENSIONS]段落
 * @property {SwmmCoordinate} COORDINATES [COORDINATES]段落
 * @property {SwmmJunction} JUNCTIONS 
 * @property {SwmmOutfall} OUTFALLS
 * @property {SwmmConduit} CONDUITS
 * @property {SwmmXSection} XSECTIONS
 * @property {SwmmSubcatchment} SUBCATCHMENTS
 * @property {SwmmCoordinate} VERTICES
 * @property {SwmmCoordinate} POLYGONS
 * @property {SwmmPump} PUMPS [PUMPS]段落
 * @property {SwmmWeir} WEIRS [WEIRS]
 * @property {SwmmOrifice} ORIFICES
 */
export function FetchBaseData(fn = "KEELUNG", timeoutMilliseconds = 10000) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMilliseconds);

    const URL = `./SwmmMap/MapDisplay/Data/${fn}.json`;

    const indicator = document.getElementById("Load-indicator1");
    indicator.innerHTML = `<span class='badge bg-primary'>讀取空間資料...</span>`;

    const promise = fetch(URL, { signal: controller.signal })
        .then(response => {
            // 使用 response.ok 檢查 HTTP 狀態碼是否在 200-299 範圍內
            if (response.ok) {
                return response.json();
            } else {
                // 拋出更詳細的錯誤訊息
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.error(`Fetch aborted: The request for ${URL} timed out after ${timeoutMilliseconds}ms.`);
                // 拋出一個更友善的錯誤訊息給呼叫者
                throw new Error('請求資料超時，請檢查網路連線或稍後再試。');
            } else {
                console.error(`Error fetching ${URL}:`, error);
                // 重新拋出原始錯誤，讓呼叫端可以捕獲
                throw error;
            }
        }).finally(() => {
            // 無論成功或失敗，都清除計時器
            clearTimeout(timeoutId);
            indicator.innerHTML = "";
        });
    return promise;
}

/**
 * 非同步地讀取指定的資料檔案 (e.g., DM_PLinks.json)。
 * 此函式與 FetchBaseData 類似，但用於讀取其他通用資料檔。
 * 它同樣會顯示讀取指示並處理超時。
 * @async
 * @function FetchData
 * @param {string} [fn="DM_PLinks.json"] - 資料檔案的完整名稱，需包含副檔名。
 * @param {number} [timeoutMilliseconds=5000] - 請求超時時間(毫秒)。
 * @returns {Promise<SwmmLinksData|object>} 一個解析為 JSON 資料物件的 Promise。其結構取決於讀取的檔案。
 * @throws {Error} 如果請求失敗、伺服器回應非 2xx 狀態或請求超時，則拋出錯誤。
 * @example
 * try {
 *   const linksData = await FetchData("DM_PLinks.json");
 *   console.log(`讀取到 ${linksData.SwmmLinks.length} 條管線。`);
 * } catch (error) {
 *   console.error("讀取資料失敗:", error);
 * }
 */
export function FetchData(fn = "DM_PNodes.json", timeoutMilliseconds = 5000) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMilliseconds);

    const URL = `./SwmmMap/MapDisplay/Data/${fn}`;

    const indicator = document.getElementById("Load-indicator1");
    indicator.innerHTML = `<span class='badge bg-primary'>讀取資料</span>`;

    const promise = fetch(URL, { signal: controller.signal })
        .then(response => {
            // 使用 response.ok 檢查 HTTP 狀態碼是否在 200-299 範圍內
            if (response.ok) {
                return response.json();
            } else {
                // 拋出更詳細的錯誤訊息
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.error(`Fetch aborted: The request for ${URL} timed out after ${timeoutMilliseconds}ms.`);
                // 拋出一個更友善的錯誤訊息給呼叫者
                throw new Error('請求資料超時，請檢查網路連線或稍後再試。');
            } else {
                console.error(`Error fetching ${URL}:`, error);
                // 重新拋出原始錯誤，讓呼叫端可以捕獲
                throw error;
            }
        }).finally(() => {
            // 無論成功或失敗，都清除計時器
            clearTimeout(timeoutId);
            indicator.innerHTML = "";
        });
    return promise;
}
