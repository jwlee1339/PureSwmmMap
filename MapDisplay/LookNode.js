// LookNode.js
// 2021-11-20
// 負責在地圖上尋找並標示特定節點的功能


import { FindNodeCoord, RedIcon, VioletIcon } from "./Map2D.js";
import { myAlert, GREENCOLOR, REDCOLOR } from "./myAlert.js";

/**
 * @class NodeMarker
 * @description 用於在地圖上管理節點標記的類別。
 */
class NodeMarker {
    /**
     * 建立一個 NodeMarker 實例。
     * @param {L.Map} map - Leaflet 地圖物件。
     * @param {object} coords - 包含所有節點座標的資料物件。
     * @param {object[]} junctions - SWMM 的連接點 (Junctions) 資料陣列。
     * @param {object[]} storages - SWMM 的儲存節點 (Storages) 資料陣列。
     * @param {object[]} outfalls - SWMM 的排放口 (Outfalls) 資料陣列。
     * @param {object[]} dividers - SWMM 的分流點 (Dividers) 資料陣列。
     * @param {import('./dfs_shuffle/TotalBasins.js').TotalBasins} [totalBasins] - (可選) TotalBasins 的實例，用於顯示集水區資訊。
     */
    constructor(map, coords, junctions, storages, outfalls, dividers, totalBasins) {
        this.map = map;
        this.coords = coords;
        this.junctions = junctions;
        this.storages = storages;
        this.outfalls = outfalls;
        this.dividers = dividers;
        this.totalBasins = totalBasins;
        // 用於存放當前標記的變數，方便後續清除
        this.Marker = undefined;
    }

    /**
     * 在地圖上加入一個彩色的標記，並根據傳入的參數決定點擊後的行為。
     * 如果提供了 `totalBasins` 和 `basins`，點擊標記將顯示集水區資訊視窗；否則，顯示一個簡單的 Popup。
     * 參考: https://github.com/pointhi/leaflet-color-markers
     * @param {{ lat: number; lng: number; }} coord - 標記的座標。
     * @param {string} NodeName - 節點的名稱。
     * @param {L.Icon} [icon=RedIcon] - (可選) 要使用的 Leaflet 圖示物件，預設為紅色圖示。
     * @param {string[]} [basins] - (可選) 與此節點相關的集水區名稱陣列。
     * @param {string} [displayMode='simple'] - (可選) 資訊視窗的顯示模式 ('simple' 或 'table')。
     * @param {string|boolean} [animate=false] - (可選) 加入標記時播放的動畫效果，可以是 'drop', 'fade' 或 false。
     */
    AddColorMarker(coord, NodeName, icon = RedIcon, basins, displayMode = 'simple', animate) {
        let point = [coord.lat, coord.lng];

        // 建立一個標記
        let marker = L.marker(point, { icon: icon });

        // 如果有 totalBasins 物件和 basins 資料，則點擊標記時顯示 modal
        if (this.totalBasins && basins) {
            marker.on('click', () => {
                if (displayMode === 'simple') {
                    this.totalBasins.render(basins);
                } else if (displayMode === 'table') {
                    this.totalBasins.renderBasinTable(basins);
                }
            });
        } else {
            // 否則，綁定預設的 Popup
            let message = `節點位置，${NodeName}<br>(${coord.lat.toFixed(4)},${coord.lng.toFixed(4)})`;
            marker.bindPopup(message);
        }

        // 將標記加入地圖
        if (this.Marker === undefined) {
            // 如果是第一次加入標記
            marker.addTo(this.map);

            // 如果需要動畫，則根據動畫名稱加入對應的 CSS class
            if (animate && typeof animate === 'string' && marker._icon) {
                const animationClass = `marker-${animate}-in`; // e.g., 'marker-drop-in', 'marker-fade-in'
                marker._icon.classList.add(animationClass);

                // 動畫結束後移除 class，避免重複播放
                marker._icon.addEventListener('animationend', () => {
                    marker._icon.classList.remove(animationClass);
                }, { once: true }); // { once: true } 會讓事件監聽器在觸發一次後自動移除
            }

            // 將地圖中心移動到標記位置
            this.map.panTo(point);
            this.Marker = marker; // 保存標記實例，以便後續清除
        } else {
            // 如果已有標記，則更新其位置
            this.Marker.setLatLng(point);
            this.map.panTo(point); // 同時移動地圖中心
        }
    }

    /**
     * 在地圖上加入一個預設圖示的標記。
     * @deprecated 此方法已被 `AddColorMarker` 取代，後者提供更豐富的功能。
     * @param {{ lat: number; lng: number; }} coord - 標記的座標。
     * @param {string} NodeName - 節點的名稱。
     */
    AddNodeMarker(coord, NodeName) {
        // clear Marker
        // console.log(this.Marker);

        //  console.log('AddNodeMarker', coord)
        let point = [coord.lat, coord.lng];

        // Creating a marker
        let marker = L.marker(point);
        let message = `節點位置，${NodeName}<br>
        (${coord.lat.toFixed(4)},${coord.lng.toFixed(4)})
        `;
        marker.bindPopup(message);
        //  marker.setLatLng(newLatLng); 

        // Adding marker to the map
        if (this.Marker === undefined) {
            marker.addTo(this.map);
            // 中心點
            // this.map.panTo(new L.LatLng(coord.lat, coord.lng));
            this.map.panTo(point);
            this.Marker = marker; // 保存標記實例，以便後續清除
        } else {
            // Change to another location
            this.Marker.setLatLng(point);
        }
    }

    /**
     * 在所有節點資料中尋找指定名稱的節點，並在地圖上標示出來。
     * @param {string} NodeName - 要定位的節點名稱。
     * @param {L.Icon} [icon=RedIcon] - (可選) 用於標示的 Leaflet 圖示物件，預設為紅色圖示。
     * @param {string[]} [basins] - (可選) 要傳遞給 `AddColorMarker` 的集水區名稱陣列。
     * @param {string} [displayMode] - (可選) 要傳遞給 `AddColorMarker` 的顯示模式。
     * @param {string|boolean} [animate=false] - (可選) 加入標記時播放的動畫效果。
     * @returns {number} 如果成功找到並標示節點，返回 0；否則返回 -1。
     */
    LocateNode(NodeName, icon = RedIcon, basins, displayMode, animate) {
        const upperNodeName = NodeName.toUpperCase();

        // 將所有可能的節點來源放入一個陣列中，方便遍歷
        const nodeSources = [
            this.junctions,
            this.storages,
            this.dividers,
            this.outfalls
        ];

        for (const source of nodeSources) {
            // 檢查節點來源是否存在且為陣列
            if (Array.isArray(source)) {
                const foundNode = source.find(node => node.name.toUpperCase() === upperNodeName);
                if (foundNode) {
                    // 找到節點後，取得座標並加入標記
                    const coord = FindNodeCoord(this.coords, NodeName);
                    this.AddColorMarker(coord, NodeName, icon, basins, displayMode, animate);
                    // console.log("found ", foundNode);
                    return 0; // 成功找到，結束函式
                }
            }
        }

        // 如果遍歷完所有來源都沒找到
        console.log('NodeName not found!');
        return -1;
    }

    /**
     * 從地圖上移除此實例所管理的標記。
     */
    Clear() {
        if (this.Marker != undefined && this.Marker != null) {
            this.map.removeLayer(this.Marker);
        }
        this.Marker = undefined; // 重置標記變數
    }
}



// 模組級的全域變數，用於保存 NodeMarker 的實例
let nodeMarkers = [];

/**
 * 內部輔助函式，用於處理尋找和標示節點的核心邏輯，以減少程式碼重複。
 * @param {L.Map} map - Leaflet 地圖物件。
 * @param {object} json - 包含所有 SWMM 資料的 JSON 物件。
 * @param {string} NodeName - 要尋找的節點名稱。
 * @param {object} [options={}] - 選項物件。
 */
function _locateAndMarkNode(map, json, NodeName, options = {}) {
    const {
        clearPrevious = true,
        icon = RedIcon,
        totalBasins,
        basins,
        displayMode = 'simple',
        animate = false
    } = options;

    // 檢查節點名稱
    if (!NodeName) {
        console.log("NodeName error!");
        return;
    }

    // 清除先前的標記
    if (clearPrevious) {
        nodeMarkers.forEach(marker => marker.Clear());
        nodeMarkers = [];
    }

    // 建立一個新的 NodeMarker 實例
    const newNodeMarker = new NodeMarker(
        map, json.COORDINATES, json.JUNCTIONS, json.STORAGE,
        json.OUTFALLS, json.DIVIDERS, totalBasins
    );
    nodeMarkers.push(newNodeMarker);

    // 執行定位並顯示結果訊息
    const results = newNodeMarker.LocateNode(NodeName, icon, basins, displayMode, animate);
    if (results === -1) {
        myAlert(`找不到節點:${NodeName}!`, REDCOLOR);
    } else {
        myAlert(`成功找到節點:${NodeName}!`, GREENCOLOR);
    }
}

/**
 * 尋找並標示節點的舊版函式。
 * @param {L.Map} map - Leaflet 地圖物件。
 * @param {{ COORDINATES: any; JUNCTIONS: any; STORAGE: any; OUTFALLS: any; DIVIDERS: any; }} json - 包含所有 SWMM 資料的 JSON 物件。
 * @param {string} NodeName - 要尋找的節點名稱。
 * @param {object} [options={}] - 選項物件。
 * @param {boolean} [options.clearPrevious=true] - 是否在標示新節點前清除所有已有的標記。
 * @param {L.Icon} [options.icon=RedIcon] - 要使用的 Leaflet 圖示物件。
 */
export function LookNode_OLD(map, json, NodeName,
    { clearPrevious = true, icon = RedIcon } = {}) {
    _locateAndMarkNode(map, json, NodeName, {
        clearPrevious,
        icon
    });
}

/**
 * 尋找並標示節點，點擊標記時會使用 TotalBasins.render 方法顯示集水區資訊。
 * 此函式提供了更豐富的互動功能，例如點擊標記後顯示詳細的集水區 Modal 視窗。
 * @param {L.Map} map - Leaflet 地圖物件。
 * @param {{ COORDINATES: any; JUNCTIONS: any; STORAGE: any; OUTFALLS: any; DIVIDERS: any; }} json - 包含所有 SWMM 資料的 JSON 物件。
 * @param {string} NodeName - 要尋找的節點名稱。
 * @param {import('./dfs_shuffle/TotalBasins.js').TotalBasins} totalBasins - TotalBasins 的實例，用於處理集水區相關的渲染。
 * @param {string[]} basins - 與此節點相關的集水區名稱陣列。
 * @param {object} [options={}] - 選項物件。
 * @param {boolean} [options.clearPrevious=true] - 是否在標示新節點前清除所有已有的標記。
 * @param {L.Icon} [options.icon=RedIcon] - 要使用的 Leaflet 圖示物件。
 * @param {string|boolean} [options.animate=false] - 加入新標記時播放的動畫效果，可以是 'drop', 'fade' 或 false。
 * @param {string} [options.displayMode='simple'] - 資訊視窗的顯示模式，可以是 'simple' 或 'table'。
 */
export function LookNode(map, json, NodeName, totalBasins, basins,
    { clearPrevious = true, icon = RedIcon, displayMode = 'simple', animate } = {}) {
    _locateAndMarkNode(map, json, NodeName, {
        clearPrevious,
        icon,
        totalBasins,
        basins,
        displayMode,
        animate
    });
}