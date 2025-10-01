// Map2D.js : 繪圖公用程式
// 2021-11-11


/**
 * 計算兩點之間的歐幾里得距離。
 * @param {number} x1 - 第一點的 x 座標。
 * @param {number} y1 - 第一點的 y 座標。
 * @param {number} x2 - 第二點的 x 座標。
 * @param {number} y2 - 第二點的 y 座標。
 * @returns {number} 兩點之間的距離。
 */
export function distance(x1, y1, x2, y2) {
    // 檢查輸入是否為有效的數字
    if ([x1, y1, x2, y2].some(val => typeof val !== 'number' || !isFinite(val))) {
        console.error("distance: All arguments must be finite numbers.");
        return 0; // 或返回 NaN, null, 或拋出錯誤，視乎應用場景
    }
    let dx = x1 - x2;
    let dy = y1 - y2;
    //console.log('(dx,dy) : ', dx, dy);
    return Math.sqrt(dx * dx + dy * dy);
}

// ------------------------
// 計算下水道管網圖中心點座標
// ------------------------
/**
 * 計算一組座標點的地理中心。
 * @param {Array<{x_97: string|number, y_97: string|number, lat: string|number, lng: string|number}>} coordinates - 座標物件的陣列。
 * @returns {{x: number, y: number, lat: number, lng: number}} 包含平均 x, y, lat, lng 的中心點物件。
 */
export let FindCenterOfMap =
    function (/** @type {any[]} */ coordinates) {
        const defaultValue = { x: 0, y: 0, lat: 0, lng: 0 };
        try {
            if (!Array.isArray(coordinates) || coordinates.length === 0) {
                return defaultValue;
            }

            // 使用 reduce 方法計算所有座標的總和
            const sums = coordinates.reduce((accumulator, currentCoord) => {
                // 確保 currentCoord 是有效物件且其屬性可轉換為數字
                if (currentCoord && typeof currentCoord === 'object') {
                    accumulator.x += Number(currentCoord.x_97) || 0;
                    accumulator.y += Number(currentCoord.y_97) || 0;
                    accumulator.lat += Number(currentCoord.lat) || 0;
                    accumulator.lng += Number(currentCoord.lng) || 0;
                }
                return accumulator;
            }, { x: 0, y: 0, lat: 0, lng: 0 });

            const numberOfCoords = coordinates.length;
            return {
                x: sums.x / numberOfCoords,
                y: sums.y / numberOfCoords,
                lat: sums.lat / numberOfCoords,
                lng: sums.lng / numberOfCoords
            };
        } catch (error) {
            console.error("Error in findCenterOfMap:", error);
            return defaultValue; // 發生錯誤時回傳預設值
        }
    }


/**
 * 在管線陣列中尋找指定名稱的管線，並回傳其起點和終點節點。
 * @param {Array<{name: string, From: string, To: string}>} linksArray - 管線物件的陣列。
 * @param {string} linkName - 要尋找的管線名稱。
 * @returns {[string, string]} 包含起點節點和終點節點名稱的陣列。如果找不到，則回傳兩個空字串。
 */
export function FindNodesOfLink(linksArray, linkName) {
    const defaultValue = ["", ""];
    try {
        if (!Array.isArray(linksArray) || typeof linkName !== 'string') {
            console.warn("findNodesOfLink: Invalid input provided.");
            return defaultValue;
        }
        // 使用 .find() 方法來尋找符合條件的管線物件，比 for 迴圈更為簡潔。
        const upperLinkName = linkName.toUpperCase();
        const foundLink = linksArray.find(link =>
            link && typeof link.name === 'string' && link.name.toUpperCase() === upperLinkName
        );

        // 如果找到了管線，則回傳其起點和終點節點；
        // 否則，回傳一個包含兩個空字串的陣列。
        return foundLink ? [foundLink.From || "", foundLink.To || ""] : defaultValue;
    } catch (error) {
        console.error("Error in findNodesOfLink:", error);
        return defaultValue; // 發生錯誤時回傳預設值
    }
}

/**
 * 在節點陣列中尋找指定名稱的節點，並回傳其座標。
 * @param {Array<{name: string, lat: string|number, lng: string|number}>} nodesArray - 節點物件的陣列。
 * @param {string} nodeName - 要尋找的節點名稱。
 * @returns {{lat: number, lng: number}} 包含節點經緯度的物件。如果找不到，則回傳預設的無效座標。
 */
export function FindNodeCoord(nodesArray, nodeName) {
    const defaultValue = { lat: -999.9, lng: -999.9 };
    try {
        if (!Array.isArray(nodesArray) || typeof nodeName !== 'string') {
            console.warn("findNodeCoord: Invalid input provided.");
            return defaultValue;
        }
        // 使用 .find() 方法尋找符合條件的節點物件
        const upperNodeName = nodeName.toUpperCase();
        const foundNode = nodesArray.find(node =>
            node && typeof node.name === 'string' && node.name.toUpperCase() === upperNodeName
        );

        // 如果找到節點，則回傳其經緯度座標 (並透過 + 轉為數字)
        // 否則，回傳預設的找不到座標
        return foundNode
            ? { lat: +foundNode.lat, lng: +foundNode.lng }
            : defaultValue;
    } catch (error) {
        console.error("Error in findNodeCoord:", error);
        return defaultValue; // 發生錯誤時回傳預設值
    }
};

/**
 * 在頂點陣列中尋找屬於特定管線的所有頂點座標。
 * @param {Array<{name: string, lat: string|number, lng: string|number}>} verticesArray - 頂點物件的陣列。
 * @param {string} linkName - 要尋找的管線名稱。
 * @returns {Array<{lat: number, lng: number}>} 屬於該管線的頂點座標陣列。
 */
export function FindVerticesOnLink(verticesArray, linkName) {
    try {
        if (!Array.isArray(verticesArray) || typeof linkName !== 'string') {
            console.warn("findVerticesOnLink: Invalid input provided.");
            return [];
        }
        // 使用 filter 篩選出符合條件的頂點，再用 map 轉換成所需的格式
        const upperLinkName = linkName.toUpperCase();
        return verticesArray
            .filter(vertex => vertex && typeof vertex.name === 'string' && vertex.name.toUpperCase() === upperLinkName)
            .map(vertex => ({ lat: Number(vertex.lat) || 0, lng: Number(vertex.lng) || 0 }));
    } catch (error) {
        console.error("Error in findVerticesOnLink:", error);
        return []; // 發生錯誤時回傳空陣列
    }
}

// 回傳四邊形的四個角落座標
// pos : [lat, lng]
// width : 長度(公里)，1度 = 110 公里

/**
 * 根據中心點和寬高計算一個矩形邊界框的左下角和右上角座標。
 * 寬高單位為公里。
 * @param {[number, number]} centerLngLat - 中心點的經緯度陣列 [lng, lat]。
 * @param {number} heightInKm - 矩形的高度（公里）。
 * @param {number} widthInKm - 矩形的寬度（公里）。
 * @returns {Array<[number, number]>} 包含左下角和右上角座標的陣列。
 */
export function CreateCenteredBox(centerLngLat, heightInKm, widthInKm) {
    try {
        if (!Array.isArray(centerLngLat) || centerLngLat.length < 2 || typeof heightInKm !== 'number' || typeof widthInKm !== 'number') {
            console.warn("createCenteredBox: Invalid input provided.");
            return [];
        }
        // console.log({pos:pos, borderHeight:borderHeight, borderWidth:borderWidth});
        let deltaLng = widthInKm / 110.0;
        let deltaLat = heightInKm / 110.0;
        // console.log({pos:pos, dlat:dlat, dlng:dlng});
        let corners = [];
        let leftLng = centerLngLat[0] - deltaLng / 2;
        let bottomLat = centerLngLat[1] - deltaLat / 2;
        let rightLng = centerLngLat[0] + deltaLng / 2;
        let topLat = centerLngLat[1] + deltaLat / 2;
        corners.push([leftLng, bottomLat]);
        corners.push([rightLng, topLat]);
        // console.log({corner:corner})
        return corners;
    } catch (error) {
        console.error("Error in createCenteredBox:", error);
        return []; // 發生錯誤時回傳空陣列
    }
}

/**
 * 從一組座標點中找出最大的經緯度值。
 * @param {Array<{lat: string|number, lng: string|number}>} pointsArray - 座標物件的陣列。
 * @returns {{lng: number, lat: number}} 包含最大經緯度的物件。
 */
export function FindMaxLatLng(pointsArray) {
    const defaultValue = { lng: -999999.0, lat: -999999.0 };
    try {
        if (!Array.isArray(pointsArray) || pointsArray.length === 0) {
            return defaultValue;
        }
        // 使用 map 提取所有經緯度，再用 Math.max 找到最大值
        const lngs = pointsArray.map(p => (p && typeof p.lng !== 'undefined') ? Number(p.lng) : -Infinity);
        const lats = pointsArray.map(p => (p && typeof p.lat !== 'undefined') ? Number(p.lat) : -Infinity);

        const maxLng = Math.max(...lngs);
        const maxLat = Math.max(...lats);

        if (isNaN(maxLng) || isNaN(maxLat)) {
            console.warn("findMaxLatLng: Found NaN in coordinates, returning default value.");
            return defaultValue;
        }

        return { lng: maxLng, lat: maxLat };
    } catch (error) {
        console.error("Error in findMaxLatLng:", error);
        return defaultValue;
    }
};

/**
 * 從一組座標點中找出最小的經緯度值。
 * @param {Array<{lat: string|number, lng: string|number}>} pointsArray - 座標物件的陣列。
 * @returns {{lng: number, lat: number}} 包含最小經緯度的物件。
 */
export function FindMinLatLng(pointsArray) {
    const defaultValue = { lng: 99999999.0, lat: 99999999.0 };
    try {
        if (!Array.isArray(pointsArray) || pointsArray.length === 0) {
            return defaultValue;
        }
        // 使用 map 提取所有經緯度，再用 Math.min 找到最小值
        const lngs = pointsArray.map(p => (p && typeof p.lng !== 'undefined') ? Number(p.lng) : Infinity);
        const lats = pointsArray.map(p => (p && typeof p.lat !== 'undefined') ? Number(p.lat) : Infinity);

        const minLng = Math.min(...lngs);
        const minLat = Math.min(...lats);

        if (isNaN(minLng) || isNaN(minLat)) {
            console.warn("findMinLatLng: Found NaN in coordinates, returning default value.");
            return defaultValue;
        }

        return { lng: minLng, lat: minLat };
    } catch (error) {
        console.error("Error in findMinLatLng:", error);
        return defaultValue;
    }
};


// * Color markers
// 路徑是相對於.html
export var BlueIcon = new L.Icon({
    iconUrl: './SwmmMap/img/marker-icon-green.png',
    shadowUrl: './SwmmMap/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


export var RedIcon = new L.Icon({
    iconUrl: './SwmmMap/img/marker-icon-red.png',
    shadowUrl: './SwmmMap/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export var VioletIcon = new L.Icon({
    iconUrl: './SwmmMap/img/marker-icon-violet.png',
    shadowUrl: './SwmmMap/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


export var GreenIcon = new L.Icon({
    iconUrl: './SwmmMap/img/marker-icon-green.png',
    shadowUrl: './SwmmMap/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export var GoldIcon = new L.Icon({
    iconUrl: './SwmmMap/img/marker-icon-gold.png',
    shadowUrl: './SwmmMap/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});