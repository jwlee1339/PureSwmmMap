// TotalBasins.js
// 2024-11-06

import { DepthFirstSearch } from "./dfs.js";
import { Shuffle, FindNodesByLinkId, CompareArrays } from "./shuffle.js";

let TotalPaths = [];

//-----
/**
 * 準備Graph for DFS, 打亂原有的管段順序
 * @param {any} PNodes 
 * @param {any} PLinks
 * @param {bool} IsShuffle - 是否打亂管渠順序，預設為true
 * @returns {Object<string, string[]>} - 代表圖形的鄰接串列物件。鍵為節點ID，值為其相鄰節點ID的陣列。
 */
export function PrepareDFSByShuffle(PNodes, PLinks, IsShuffle = true) {
    let Graph = {};
    // 遍歷所有節點，製作圖結構
    PNodes.SwmmNodes.forEach(function (node) {
        // console.log("--- 原有順序", node.aLink)
        Graph[node.ID] = [];
        if (IsShuffle) {
            Shuffle(node.aLink);
            // console.log("--- 打亂順序", node.aLink);
        }

        for (let i = 0; i < node.aLink.length; i++) {

            // 尋找節點
            let linkid = node.aLink[i];
            let id = FindNodesByLinkId(PLinks, linkid);

            if (id.FromNode === null && id.ToNode === null) {
                console.warn(`linkid:${linkid},FromNode:${id.FromNode},ToNode:${id.ToNode}`);
                continue;
            }
            // 存入節點名稱
            if (id.FromNode === node.ID) {
                Graph[node.ID].push(id.ToNode);
            }
            // 雙向或單向，這是單向
            // else {
            //     Graph[node.ID].push(id.FromNode);
            // }

            // if (node.ID === "20"){
            //     console.log(node.aLink, id, Graph[node.ID]);
            // }
        }

    });
    return Graph;
}
/**
 * 使用深度優先搜尋 (DFS) 演算法尋找單一路徑。
 * @param {Object<string, string[]>} Graph - 代表圖形的鄰接串列物件。鍵為節點ID，值為其相鄰節點ID的陣列。
 * @param {string} StartNode - 起始節點 ID。
 * @param {string} EndNode - 結束節點 ID。
 * @returns {string[]} - 路徑節點 ID 的陣列。
 */
export function FindSinglePathByDFS(Graph, StartNode, EndNode) {

    // DFS 演算法搜尋路徑
    let DFS = new DepthFirstSearch(Graph, StartNode, EndNode);
    let path = DFS.FindPath();
    // console.log(StartNode, EndNode, path);
    // 如果尚未儲存，也不重複，就存入串列
    let compare_result = false;
    for (let i = 0; i < TotalPaths.length; i++) {
        let arr1 = TotalPaths[i];
        if (compare_result = CompareArrays(arr1, path)) break;
    }
    // 存入串列
    if (!compare_result) TotalPaths.push(path);
    //console.log(`TotalPaths.length:${TotalPaths.length}`);
    return path;
}
/**
 * 根據給定的起點和終點節點名稱，直接尋找一條路徑。
 * @param {*} PNodes - SWMM節點資料 
 * @param {*} PLinks - SWMM管段資料
 * @param {string} StartNode - 起點節點 ID。
 * @param {string} EndNode - 終點節點 ID。
 * @returns {string[] | undefined} - 返回找到的路徑節點陣列，如果資料未載入則返回 undefined。
 */
export function FindPathByStartEndNode(PNodes, PLinks, StartNode, EndNode) {
    // 檢查是否有SWMM節點及管段資料
    if (PNodes === undefined || PLinks === undefined) {
        console.error("缺PNodes, PLinks資料!");
        return;
    }
    let Graph_shuffle = PrepareDFSByShuffle(PNodes, PLinks);
    let NodeIds = FindSinglePathByDFS(Graph_shuffle, StartNode, EndNode);
    return NodeIds;
}

// LOOP 所有子集水區 從子集水區匯入節點當作起點 使用者指定終點節點 測試是否為可能排水路徑 若是則該子集水區最終會排入該指定終點節點
// 收集上述排入終點節點的子集水區 就成為其集水區

export class TotalBasins {

    /**
     * 找到指定節點的集水區, (From Node -> To Node)
     * @param {{ Name: string, RainGage: string, Outlet: string, Area: string,
     *           Imperv : string, Width: string, Slope: string}[]} Subcatchments 子集水區物件
     * @param {*} PNodes SWMM 節點物件
     * @param {*} PLinks SWMM 管段物件
     */
    constructor(Subcatchments, PNodes, PLinks) {
        this.Subcatchments = Subcatchments;
        this.PNodes = PNodes;
        this.PLinks = PLinks;
        //-----Local Variables
        this.Graph_shuffle = PrepareDFSByShuffle(PNodes, PLinks,false);
        this.BasinOutlet = [];
    }

    // 取得指定集水區面積
    GetBasinArea(Name) {
        let basin = this.Subcatchments.find(x => x.Name === Name);
        if (basin === undefined) return 0;
        //console.log(basin);
        return Number(basin.Area);
    }


    GetSubbasinByOutlet(Name) {
        return this.Subcatchments.find(x => x.Outlet === Name) || null;
    }

    /**
     * 找到指定節點的集水區
     * @param {string} EndNode ex. "D15-1"
     * @returns {string[]} 集水區名稱串列
     */
    Find(EndNode) {
        if (EndNode === undefined || EndNode.length === 0) {
            console.error("終點節點不可為空值!");
            return;
        }
        // 1.找到所有子集水區名稱串列
        // 2.找到所有子集水區匯入節點名稱串列
        let basins = [];
        // 3.Loop for all Outflow Nodes, Find dfs single path
        // 搜尋單一路徑
        for (let i = 0; i < this.Subcatchments.length; i++) {
            let SubName = this.Subcatchments[i].Name;
            let StartNode = this.Subcatchments[i].Outlet;
            //console.log({StartNode},{EndNode});
            let NodeIds = FindSinglePathByDFS(this.Graph_shuffle, StartNode, EndNode);
            if (NodeIds === undefined) {
                console.warn("dfs-shuffle,無路徑!")
                continue;
            }
            if (NodeIds.length > 1) {
                // 存起來
                basins.push(SubName);
                //console.log(SubName);
            }
        }
        // 加上匯入EndNode子集水區
        let last_sub = this.GetSubbasinByOutlet(EndNode);
        if (last_sub !== null) basins.push(last_sub.Name);
        return basins;
    }
    /**
     * 使用一個浮動的 div (對話方塊) 來顯示集水區結果。
     * @param {string[]} basins - 包含集水區名稱的陣列。
     */
    render(basins) {
        // --- 1. 準備要顯示的訊息 ---
        let messageContent;
        const title = '集水區分析結果';

        // 檢查 basins 陣列是否為 undefined 或空陣列
        if (basins === undefined || basins.length === 0) {
            messageContent = '尚未找到任何集水區，或集水區已被重設。';
        } else {
            // 將集水區陣列轉換為一個用 ' → ' 分隔的字串，使其更易讀
            const basinString = basins.join(' → ');
            messageContent = `<b>集水區 :</b> ${basinString}`;
            // 計算所有集水區面積
            let totalArea = 0;
            for (let i = 0; i < basins.length; i++) {
                totalArea += this.GetBasinArea(basins[i]);
            }
            // 顯示集水區面積
            messageContent += `<br>集水區面積=${totalArea.toFixed(2)}公頃`;
        }

        // --- 2. 建立浮動視窗 (Modal) ---
        // 移除任何已存在的舊視窗，避免重複
        const existingModal = document.getElementById('basin-result-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 建立視窗主體
        const modal = document.createElement('div');
        modal.id = 'basin-result-modal';

        // --- 3. 設定視窗樣式 (CSS) ---
        Object.assign(modal.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: '1001',
            minWidth: '350px',
            maxWidth: '80vw',
        });

        // --- 4. 建立視窗內容 (使用 HTML 字串模板) ---
        modal.innerHTML = `
            <h5 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: center;">${title}</h5>
            <p style="font-size: 1.0em; margin: 15px 0; line-height: 1.5;">${messageContent}</p>
            <div style="text-align: right; margin-top: 15px;">
                <button id="basin-modal-close-btn" style="padding: 8px 16px; border: none; border-radius: 5px; background-color: #007bff; color: white; cursor: pointer;">關閉</button>
            </div>
        `;

        // --- 5. 將視窗加入到網頁並設定關閉事件 ---
        document.body.appendChild(modal);
        document.getElementById('basin-modal-close-btn').addEventListener('click', () => modal.remove());
    }

    /**
     * 使用一個浮動的 div (對話方塊) 以表格形式顯示詳細的集水區資訊。
     * @param {string[]} basins - 包含集水區名稱的陣列。
     */
    renderBasinTable(basins) {
        // --- 1. 準備要顯示的資料和訊息 ---
        const title = '集水區詳細資料';

        // 檢查 basins 陣列是否為 undefined 或空陣列，若是則顯示簡單訊息
        if (basins === undefined || basins.length === 0) {
            this.render(basins); // 重用 render 方法來顯示 "未找到" 的訊息
            return;
        }

        // 根據 basins 名稱陣列，從 Subcatchments 取得完整的物件資料
        const basinDetails = this.Subcatchments.filter(sub => basins.includes(sub.Name));
        let totalArea = 0;

        // --- 2. 建立表格的 HTML ---
        // 建立表頭
        const tableHeader = `
            <thead>
                <tr style="text-align: left;">
                    <th>集水區名稱</th>
                    <th>面積 (公頃)</th>
                    <th>匯流點</th>
                    <th>不透水率 (%)</th>
                    <th>寬度 (m)</th>
                </tr>
            </thead>
        `;

        // 建立表格內容行
        const tableRows = basinDetails.map(sub => {
            const area = this.GetBasinArea(sub.Name);
            totalArea += area;
            return `
                <tr>
                    <td>${sub.Name}</td>
                    <td>${area.toFixed(4)}</td>
                    <td>${sub.Outlet}</td>
                    <td>${Number(sub.Imperv).toFixed(2)}</td>
                    <td>${Number(sub.Width).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        // 建立表尾 (顯示總面積)
        const tableFooter = `
            <tfoot>
                <tr>
                    <td><b>總計</b></td>
                    <td><b>${totalArea.toFixed(4)}</b></td>
                    <td colspan="3"></td>
                </tr>
            </tfoot>
        `;

        const tableHtml = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">${tableHeader}<tbody>${tableRows}</tbody>${tableFooter}</table>`;

        // --- 3. 建立與 render() 類似的浮動視窗 ---
        const existingModal = document.getElementById('basin-table-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'basin-table-modal';

        Object.assign(modal.style, { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: '1002', minWidth: '500px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' });

        modal.innerHTML = `
            <style>
                #basin-table-modal table, 
                #basin-table-modal th, 
                #basin-table-modal td { border: 1px solid #ddd; padding: 8px; }
                #basin-table-modal th { 
                    position: sticky; /* 讓表頭在捲動時固定 */
                    top: 0; /* 固定在捲動容器的頂部 */
                    background-color: #f2f2f2; /* 設定背景色以遮蓋下方捲動的內容 */
                    z-index: 1; /* 確保表頭在內容之上 */
                }
                #basin-table-modal tr:nth-child(even){background-color: #f9f9f9;}
            </style>
            <h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: center;">${title}</h3>
            <div class="table-container" style="margin: 20px 0; max-height: 60vh; overflow-y: auto;">${tableHtml}</div>
            <div style="text-align: right; margin-top: 20px;">
                <button id="basin-table-download-btn" style="padding: 10px 20px; border: none; border-radius: 5px; background-color: #28a745; color: white; cursor: pointer; margin-right: 10px;">下載 CSV</button>
                <button id="basin-table-close-btn" style="padding: 10px 20px; border: none; border-radius: 5px; background-color: #007bff; color: white; cursor: pointer;">關閉</button>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('basin-table-close-btn').addEventListener('click', () => modal.remove());

        // --- 4. 設定下載 CSV 事件 ---
        document.getElementById('basin-table-download-btn').addEventListener('click', () => {
            // 建立 CSV 標頭
            const csvHeader = ['集水區名稱', '面積 (公頃)', '匯流點', '不透水率 (%)', '寬度 (m)'];

            // 建立 CSV 內容行
            const csvRows = basinDetails.map(sub => {
                const area = this.GetBasinArea(sub.Name);
                // 將文字欄位用引號包起來，避免內容中的逗號造成格式錯誤
                return [
                    `"${sub.Name}"`,
                    area.toFixed(4),
                    `"${sub.Outlet}"`,
                    Number(sub.Imperv).toFixed(2),
                    Number(sub.Width).toFixed(2)
                ].join(',');
            });

            // 建立總計行
            const totalRow = [`"總計"`, totalArea.toFixed(4), '', '', ''].join(',');

            // 組合完整的 CSV 內容 (標頭、內容、總計)
            const csvContent = [csvHeader.join(','), ...csvRows, totalRow].join('\n');

            // 建立 Blob 並觸發下載
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // 加入 BOM 讓 Excel 正確識別 UTF-8
            const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = '集水區資料.csv';
            link.click();
            URL.revokeObjectURL(link.href);
        });
    }
}