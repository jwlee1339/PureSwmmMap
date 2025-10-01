// GetBaseData.js
// 2024-10-15
// SWMM基本資料json
// 指定節點 找到入流及出流管段名稱
// 引入SWMM基本資料

/**
 * @namespace Base
 * @description 包含 SWMM 專案的基本資料和相關的查找函式。
 */
export var Base = {
    /**
     * @property {object} data - 儲存從 SWMM .inp 檔案解析出來的空間資料，包括節點、管段、子集水區等。
     * @property {object} data.COORDINATES - 節點座標資料。
     * @property {Array<object>} data.POLYGONS - 子集水區邊界多邊形資料。
     * @property {Array<object>} data.SUBCATCHMENTS - 子集水區資料。
     * @property {object} data.SUBAREAS - 子集水區子區域資料。
     * @property {Array<object>} data.CONDUITS - 管渠資料。
     * @property {object} data.VERTICES - 管線頂點資料。
     * @property {object} data.XSECTIONS - 斷面資料。
     * @property {object} data.TRANSECTS - 河道斷面資料。
     * @property {object} data.CURVES - 曲線資料。
     * @property {Array<object>} data.WEIRS - 堰資料。
     * @property {Array<object>} data.ORIFICES - 孔口資料。
     * @property {Array<object>} data.PUMPS - 抽水站資料。
     * @property {Array<object>} data.JUNCTIONS - 連接點資料。
     * @property {Array<object>} data.OUTFALLS - 排放口資料。
     * @property {Array<object>} data.STORAGE - 儲存節點資料。
     * @property {object} data.DIVIDERS - 分流點資料。
     */
    data: {},
    /**
     * 找到指定節點的入流管段名稱。
     * @param {string} node_name - 節點名稱。
     * @returns {string[]} - 入流管段的名稱陣列。
     */
    find_inflow_links(node_name) {
        let links = [];
        // Conduits
        let c = this.data.CONDUITS.filter(x => x['To'] === node_name);
        for (let i = 0; i < c.length; i++) {
            // 儲存管段名稱
            links.push(c[i]['name']);
        }
        // Pumps
        let p = this.data.PUMPS.filter(x => x['To'] === node_name);
        for (let i = 0; i < p.length; i++) {
            // 儲存管段名稱
            links.push(p[i]['name']);
        }
        // Orifices
        let o = this.data.ORIFICES.filter(x => x['To'] === node_name);
        for (let i = 0; i < o.length; i++) {
            // 儲存管段名稱
            links.push(o[i]['name']);
        }
        // Weirs
        let w = this.data.WEIRS.filter(x => x['To'] === node_name);
        for (let i = 0; i < w.length; i++) {
            // 儲存管段名稱
            links.push(w[i]['name']);
        }
        return links;
    },

    /**
     * 找到指定節點的出流管段名稱。
     * @param {string} node_name - 節點名稱。
     * @returns {string[]} - 出流管段的名稱陣列。
     */
    find_outflow_links(node_name) {
        let links = [];
        // Conduits
        let c = this.data.CONDUITS.filter(x => x['From'] === node_name);
        for (let i = 0; i < c.length; i++) {
            // 儲存管段名稱
            links.push(c[i]['name']);
        }
        // Pumps
        let p = this.data.PUMPS.filter(x => x['From'] === node_name);
        for (let i = 0; i < p.length; i++) {
            // 儲存管段名稱
            links.push(p[i]['name']);
        }
        // Orifices
        let o = this.data.ORIFICES.filter(x => x['From'] === node_name);
        for (let i = 0; i < o.length; i++) {
            // 儲存管段名稱
            links.push(o[i]['name']);
        }
        // Weirs
        let w = this.data.WEIRS.filter(x => x['From'] === node_name);
        for (let i = 0; i < w.length; i++) {
            // 儲存管段名稱
            links.push(w[i]['name']);
        }
        return links;
    },
    /**
     * 取得指定節點的入流及出流管段名稱。
     * @param {string} node_name - 節點名稱。
     * @returns {{inf_links: string[], ouf_links: string[]}} - 包含入流和出流管段陣列的物件。
     */
    get_inf_ouf(node_name) {
        let inf_links = this.find_inflow_links(node_name);
        let ouf_links = this.find_outflow_links(node_name);
        const combined = { inf_links, ouf_links };
        return combined;
    },
    /**
     * 根據起點和終點節點名稱，找到它們之間的管段名稱。
     * @param {string} from - 起點節點名稱。
     * @param {string} to - 終點節點名稱。
     * @returns {string[]} - 連接這兩個節點的管段名稱陣列。
     */
    getLinkByFromTo(from, to) {
        const links = [];
        const linkTypes = ['CONDUITS', 'PUMPS', 'ORIFICES', 'WEIRS'];

        for (const type of linkTypes) {
            // 確保該類型的管線資料存在
            if (this.data[type]) {
                // 使用 filter 找到所有匹配的管線
                const foundLinks = this.data[type].filter(x =>
                    (x['From'] === from && x['To'] === to) ||
                    (x['From'] === to && x['To'] === from)
                );
                // 將找到的管線名稱加入陣列
                if (foundLinks.length > 0) {
                    // links.push(...foundLinks.map(link => link.name));
                    // 只要第一個
                    links.push(foundLinks[0]['name']);
                }
            }
        }
        return links;
    }

};
