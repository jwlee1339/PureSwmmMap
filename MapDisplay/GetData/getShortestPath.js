// getShortestPath.js
// 2025-08-26
// 崇峻伺服器 API

import { myAlert } from "../myAlert.js";

const HOST = "http://forecast.chongjun.tw:8099/11_PureSwmmMap/";

/**
 * @typedef {object} PathLink 描述路徑中的一個管段(Link)的詳細資訊。
 * @property {string} ID - 管段的唯一識別碼 (例如 "D18-1~D18")。
 * @property {string} Type - 管段類型，通常是 "CONDUIT"。
 * @property {boolean} Marked - 一個標記，可能用於內部處理。
 * @property {string} FromNode - 此管段的起始節點ID。
 * @property {string} ToNode - 此管段的終點節點ID。
 * @property {number} Length - 管段的長度。
 * @property {number} Height - 管段的高度（或直徑）。
 * @property {number} InOffset - 管段起點的管底高程。
 * @property {number} OutOffset - 管段終點的管底高程。
 */

/**
 * @typedef {object} PathNode 描述路徑中的一個節點(Node)的詳細資訊。
 * @property {string} ID - 節點的唯一識別碼 (例如 "D18")。
 * @property {string} type - 節點類型 (例如 "JUNCTION", "OUTFALL")。
 * @property {number} Invert - 節點的管底高程。
 * @property {number} MaxDepth - 從地面到管底的最大深度。
 * @property {string[]} aLink - 連接到此節點的所有管段ID陣列。
 * @property {number} PathLength - 從路徑起點到此節點的累積長度。
 * @property {number} TopElevation - 節點的地面或人孔頂高程。
 */

/**
 * @typedef {object} PathResult 描述一條從起點到終點的完整路徑。
 * @property {string} Version - 產生路徑的演算法版本 (例如 "[V2]DFS搜尋指定節點路徑(無方向性管網)")。
 * @property {string} ProjectId - SWMM 專案的識別碼 (例如 "TY_DMCREEK")。
 * @property {string} SWMMInpFile - 來源 SWMM 輸入檔的路徑。
 * @property {string} StartNode - 路徑搜尋的起始節點ID。
 * @property {string} EndNode - 路徑搜尋的終點節點ID。
 * @property {string} PublishDate - 此路徑資料的產生日期與時間。
 * @property {string[]} LinkIds - 組成路徑的管段ID順序陣列。
 * @property {string[]} NodeIds - 組成路徑的節點ID順序陣列。
 * @property {PathNode[]} PNodes - 路徑中每個節點的詳細物件陣列。
 * @property {PathLink[]} PLinks - 路徑中每個管段的詳細物件陣列。
 * @property {string} Message - 狀態訊息，成功時通常為 "OK"。
 */

/**
 * 從崇峻伺服器非同步獲取兩個節點之間的最短路徑。
 * 此函式會從 DOM 讀取起始與結束節點，並向後端 API 發送請求。
 * 後端使用 Dijkstra 演算法計算路徑。
 *
 * @async
 * @function GetShortestPathFromCJServer
 * @description API 使用範例: `http://forecast.chongjun.tw:8099/11_PureSwmmMap/SwmmMap/MapDisplay/asp/DijkstraPath.aspx?ProjID=TY_DMCREEK&StartNode=TS-T5&EndNode=TY-T1`
 * @param {string} projectId - 專案的識別碼，例如 "TY_DMCREEK"。
 * @returns {Promise<PathResult[]|null>} 一個解析後為路徑結果陣列的 Promise。如果發生錯誤或找不到路徑，則返回 `null`。
 */
export async function GetShortestPathFromCJServer(projectId) {

    // 檢查是否輸入資料
    let FromNode = document.getElementById("user-FromNode").value;
    let EndNode = document.getElementById("user-EndNode").value;
    console.log(FromNode.length, EndNode);

    if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
        myAlert("起點(FromNode)不得為空!", "red");
        return null;
    }
    FromNode = FromNode.trim();
    EndNode = EndNode.trim();

    // 相對於html 路徑
    let URL = `SwmmMap/MapDisplay/asp/DijkstraPath.aspx?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;
    URL = HOST + URL;
    console.log(URL);

    try {
        // 使用 fetch 提出請求，並設定 10 秒超時
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(URL, { signal: controller.signal });

        // 清除超時定時器
        clearTimeout(timeoutId);

        // 檢查 HTTP 回應狀態，若非 2xx 則拋出錯誤
        if (!response.ok) {
            throw new Error(`伺服器回應錯誤，狀態碼: ${response.status}`);
        }

        // 解析 JSON 格式的回應內容
        const res = await response.json();

        // 檢查 API 回傳的業務邏輯是否成功
        if (!res || res.length === 0 || (res[0] && res[0].Message !== "OK")) {
            const errorMessage = res && res[0] ? res[0].Message : "找不到路徑或未知的 API 回應";
            myAlert(`路徑搜尋失敗: ${errorMessage}`, "orange"); // 使用不同顏色提示，表示非嚴重錯誤
            console.error("API Logic Error:", errorMessage);
            return null; // 正常返回 null，不視為程式異常
        }
        
        // 所有檢查通過，回傳成功結果
        return res;

    } catch (error) {
        // 統一處理網路錯誤、請求超時、或伺服器 HTTP 錯誤
        if (error.name === 'AbortError') {
            console.error("Request timed out:", URL);
            myAlert("伺服器請求超時，請稍後再試。", "red");
        } else {
            console.error("無法從伺服器獲取最短路徑:", error.message);
            myAlert("無法取得路徑資料，請檢查網路連線或伺服器狀態。", "red");
        }
        return null;
    }
}
//-----