// shuffle.js 
// 2023-11-30
// 打亂array順序
/**
 * 使用 Fisher-Yates (aka Knuth) 演算法將陣列元素隨機排序。
 * @param {Array<any>} array - 要進行隨機排序的陣列。
 * @returns {Array<any>} 傳回隨機排序後的陣列。
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
export function Shuffle(array) {
    let j, x, i;
    for (i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

/**
 * 透過將兩個陣列轉換為 JSON 字串來比較它們是否相等。
 * @param {Array<any>} arr1 - 第一個要比較的陣列。
 * @param {Array<any>} arr2 - 第二個要比較的陣列。
 * @returns {boolean} 如果兩個陣列相等則傳回 true，否則傳回 false。
 */
export function CompareArrays(arr1, arr2) {
    // 將陣列轉換為字串
    var str1 = JSON.stringify(arr1);
    var str2 = JSON.stringify(arr2);

    // 比較字串是否相等
    return str1 == str2;
}


/**
 * 根據管段 ID (linkId) 從管段資料中找到其起點 (FromNode) 和終點 (ToNode)。
 * @param {object} PLinks - 包含所有管段資料的物件，應有 `SwmmLinks` 陣列。
 * @param {string} linkId - 要查詢的管段 ID。
 * @returns {{FromNode: string | null, ToNode: string | null}} 包含起點和終點節點 ID 的物件，如果找不到則為 null。
 */
export function FindNodesByLinkId(PLinks, linkId) {
    const link = PLinks.SwmmLinks.find(x => x.ID === linkId);
    if (link) {
        return { FromNode: link.FromNode, ToNode: link.ToNode };
    }
    return { FromNode: null, ToNode: null };
}

/**
 * 根據節點和管段資料準備一個圖（鄰接串列），用於深度優先搜尋 (DFS)。
 * 可選擇是否在處理前將每個節點的連接管段順序隨機打亂。
 * @param {object} PNodes - 包含所有節點資料的物件，應有 `SwmmNodes` 陣列。
 * @param {object} PLinks - 包含所有管段資料的物件。
 * @param {object} [options={}] - 選項物件。
 * @param {boolean} [options.shuffle=false] - 是否要隨機排序鄰接節點。
 * @param {'bidirectional' | 'unidirectional'} [options.direction='bidirectional'] - 'bidirectional' (雙向) 會建立無向圖，'unidirectional' (單向) 則只會建立 FromNode -> ToNode 的有向圖。
 * @returns {Object<string, Array<string>>} 表示圖的鄰接串列。
 */
export function PrepareDFS(PNodes, PLinks, 
    { shuffle = false, direction = 'bidirectional' } = {}) {
    // 建立圖
    const Graph = {};
    // 遍歷節點
    PNodes.SwmmNodes.forEach(node => {
        Graph[node.ID] = [];

        // 根據 shuffle 選項決定是否要打亂管線順序
        // 為避免副作用，這裡會建立一個 aLink 的複本來處理
        const linksToProcess = shuffle ? Shuffle([...node.aLink]) : node.aLink;

        for (const linkid of linksToProcess) {
            // 尋找節點
            const id = FindNodesByLinkId(PLinks, linkid);

            if (id.FromNode === null && id.ToNode === null) {
                console.warn(`linkid:${linkid},FromNode:${id.FromNode},ToNode:${id.ToNode}`);
                continue;
            }
            // 存入節點名稱，將管線的另一端節點加入鄰接串列
            if (id.FromNode === node.ID) { // 如果節點是管段的起點
                Graph[node.ID].push(id.ToNode);
            } else { // 如果節點是管段的終點
                // 這裡可以控制 單向 或 雙向 排水
                // 單向排水使用於 找集水區 (只考慮 FromNode -> ToNode)
                // 雙向排水使用於 找可能排水路徑 (無向圖)
                if (direction === 'bidirectional') {
                    Graph[node.ID].push(id.FromNode);
                }
            }
        }
    });
    return Graph;
}
