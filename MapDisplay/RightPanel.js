// RightPanel.js
// 2023-12-09
// 右側控制盤

// lit-core library
// 匯入 lit-core 函式庫
import { render, html } from "./lit/lit-core.min.js";

// SWMM空間資料
// 匯入 SWMM 空間資料相關模組
import { Base } from "./GetBaseData.js";
// 搜尋並標註節點
import { LookNode, LookNode_OLD } from "./LookNode.js";

// BFS,Dijkstra,Lee 路徑搜尋
import { GetShortestPathFromCJServer } from "./GetData/getShortestPath.js";

import { RunDFSShuffle } from "./dfs_shuffle/dfs_shuffle.js";
// DFS所有可能路徑
import { DFS_AllPaths } from "./DFS_AllPaths.js";

// 動態排水路徑, [繪製] [重新開始動畫] [停止動畫] [清除]
import { ClearAimatePath } from "./DrawSwmm/AnimatePath.js";

// 縱剖面圖
import { Profile_main, gen_ProfileChartTitle, BlankForDemo } from "./Map_Profile/js/Profile_main.js";

// 匯入 SwmmMapService 相關功能
import {
    SwmmMap, StartDrawSwmm, drawSubcatchments, drawDMBorder, RedrawNodeCircles, DrawSubcatchmentBoundary,
    ClearAllLinks, ClearAllNodes, ClearSubcatchments,
    IsDrawSubBasin, IsShowArrowHead
} from "./MapResults/SwmmMapService.js";

// 排水路徑
import { GetProfileData, StoreProfileData } from "./GetPathData.js";
import { ClearAllPaths, DrawPaths, DrawSinglePath } from "./DrawSwmm/DrawPath.js"

// 自訂警示訊息
import { myAlert, GREENCOLOR, REDCOLOR } from "./myAlert.js";

// 找到所有集水區
import { TotalBasins } from "./dfs_shuffle/TotalBasins.js";
import { DrawFilteredSubcatchmentBoundary } from "./MapResults/SwmmMapService.js";
// icons
import { RedIcon, VioletIcon } from "./Map2D.js";
// 繪製DFS排水路徑
import { DrawSingleDFSPath, ClearDFSPath } from "./DrawSwmm/DrawDFSPath.js";
import { PauseAllPaths, ResumeAllPaths } from './DrawSwmm/DrawDFSPath.js';
// getPNodes(), getPLinks()
import { getPNodes, getPLinks } from "./dfs_shuffle/dfs_shuffle.js";

// DFS 排水路徑
let DFS_path = [];

/**右側控制盤 */
export class RightPanel {

    /**
      * 建立一個 RightPanel 實例。
      * @param {HTMLElement} container
      */
    constructor(container) {
        this.container = container; // 右側面板的容器元素

        // 快取 DOM 元素，避免重複查詢
        this.fromNodeInput = null;
        this.endNodeInput = null;
        this.userNodeNameInput = null;
        this.drawPathButton = null;
        this.toggleProfileButton = null;
        this.toggleAnimatePathButton = null;

        // 用於管理狀態的屬性
        this.isMapDraggable = false;
        this.isSubcatchmentsDrawn = true; // 預設為已繪製
        this.isPathDrawn = false; // 預設為未繪製
        this.isProfileVisible = false; // 縱剖面圖是否可見
        this.isAnimationPaused = false; // 動畫是否暫停

        // 節點半徑
        this.node_radius = 10; // 節點的預設半徑
    }


    /** 
     * 產生面板的 HTML 內容。
     * @returns {import("./lit/lit-core.min.js").TemplateResult} lit-html 模板。
     */
    GenPanel() {
        let css = html`
        <style>
            /* 啟用移動地圖、停止移動地圖、繪製子集水區 */
            /* 繪製 */
            .button {
                background-color: white;
                border-radius: 3px;
                border: 1px solid #008cba;
                margin-top: 0.1rem;
            }
            .button:hover {
                background-color: red;
                color: white;
            }
            /* 清除 */
            .button1{
                background-color: white;
                border-radius: 3px;
                border: 1px solid blue;
                margin-top: 0.1rem;
            }
            .button1:hover{
                background-color: green;
                color: white;
            }
            .button:disabled, .button1:disabled {
                background-color: #ccc;
                border-color: #999;
                color: #666;
                cursor: not-allowed;
            }
            .dropdown-divider {
                height: 0;
                margin: 0.5rem 0;
                overflow: hidden;
                border-top: 1px solid rgba(0, 0, 0, 0.15);
            }
            .input1 {
                border-radius: 4px;
                background-color: white;
                color: black;
                border: 1px solid #008cba;
                /*width: 100px;*/
                width:auto;
                margin-top: 0.2rem;
            }
            .input1:focus-within {
                border: 1px solid #ba0000;
            }
            .input2 {
                border-radius: 4px;
                background-color: white;
                color: black;
                border: 1px solid #008cba;
                margin-top: 2px;
                width:auto;
                /*width: 100px;*/
            }
            .input2:focus-within {
                border: 1px solid #ba0000;
            }
            /* 專案選擇 */
            .map-search-bars{
                position: absolute;
                background-color: inherit;
                transition-duration: 0.4s;
                right:110px;
                z-index: 402 !important;
            }
            .map-search-input{
                width:auto;
                border-radius: 4px;
                border:1px solid blue;
                margin-top: 0.2rem;
                padding:1px 4px;
                background-color: white;
            }
            .map-search-input:focus-within {
                border: 1px solid #ba0000;
            }
        </style>
        `;
        let btns = html`
              ${css}
              <div class="card-body d-flex flex-column p-1">
                <!-- 專案選項 -->
                <div class="map-search-input">
                    <input id="project-select" value='TY_DMCREEK' style="border:0px;"/>
                </div>

                <!-- buttons -->
                <button class="button" @click=${(e) => this.handleDragable(e)}>啟用移動地圖</button>
                <button class="button" @click=${(e) => this.DrawSubcatchments(e)}>清除子集水區</button>
                <button id="draw-path-button" class="button1" @click=${(e) => this.handleDrawPath(e)} disabled>繪製路徑線</button>
                <button class="button" @click=${() => this.ShrinkNodeCircle()}>縮小節點</button>

                <hr class="dropdown-divider">
                <!-- select path -->
                <input id="user-FromNode" class="input1" placeholder="起點">
                <input id="user-EndNode" class="input2" placeholder="終點">
                <button class="button" @click=${() => this.handleShortestPath()}>最少節點路徑</button>
                <!-- <button class="button" @click=${() => this.handleDijkstraPath()}>兩點最短路徑</button> -->

                <button class="button" @click=${() => this.handleDijkstraAllPaths()}>到出水口路徑</button> 

                <!-- find-path-DFS -->
                <!-- <button class="button" @click=${() => this.handleDFSAllPaths()}>DFS可能路徑</button> -->
                <!-- dfs-shuffle -->
                <button class="button" @click=${() => this.handleDFSShuffle()}>DFS亂數路徑</button>
                <button class="button" @click=${() => this.handleFindBasins()}>尋找集水區</button>
                <hr class="dropdown-divider">
                <button id="toggle-profile-button" class="button" @click=${(e) => this.handleToggleProfileChart(e)}>繪製縱剖面</button>

                <hr class="dropdown-divider">
                <!-- 查詢節點 -->
                <input id="user-node-name" placeholder="查詢節點名稱" type="text" class="map-search-input">
                <button class="button bg-primary text-white" @click=${() => this.handleLookNode()}>查詢</button>
                <button id="toggle-animate-path" class="button" @click=${(e) => this.handleToggleAnimate(e)} disabled>暫停動態路徑</button>
                <button class="button" @click=${() => this.handleClearAnimatePath()}>清除動態路徑</button>
                
            </div>
            <span id="Load-indicator1"></span>
        `;
        return btns;
    }

    /**
     * 初始化並快取 DOM 元素。
     * 在 render 方法之後呼叫。
     */
    _initDOMElements() {
        this.fromNodeInput = document.getElementById("user-FromNode");
        this.endNodeInput = document.getElementById("user-EndNode");
        this.userNodeNameInput = document.getElementById("user-node-name");
        this.drawPathButton = document.getElementById("draw-path-button");
        this.toggleProfileButton = document.getElementById("toggle-profile-button");
        this.toggleAnimatePathButton = document.getElementById("toggle-animate-path");
    }

    /**
     * 重設並啟用動畫控制按鈕。
     */
    _resetAndEnableAnimationButton() {
        if (this.toggleAnimatePathButton) {
            this.toggleAnimatePathButton.disabled = false;
            this.isAnimationPaused = false; // 動畫預設為播放狀態
            this._toggleButtonState(this.toggleAnimatePathButton, true, {
                activeText: "暫停動態路徑",
                inactiveText: "繼續動態路徑",
                activeClass: "button",
                inactiveClass: "button1"
            });
        }
    }

    /**
     * 當找到並繪製路徑後，啟用並更新繪製/清除路徑按鈕的狀態。
     * @param {boolean} isDrawn - 路徑是否已繪製。
     */
    _setPathDrawnState(isDrawn) {
        if (this.drawPathButton) {
            this.isPathDrawn = isDrawn;
            this.drawPathButton.disabled = false; // 啟用按鈕
            this._toggleButtonState(this.drawPathButton, this.isPathDrawn, {
                activeText: "清除路徑線",
                inactiveText: "繪製路徑線",
                activeClass: "button",
                inactiveClass: "button1"
            });
        }
    }

    /**
     * 專案名稱改變後，清除所有SWMM物件，並重新繪製。
     * @param {Event} e - 事件物件。
     */
    async ChangeProject(e) {
        console.warn("施工中")
    }

    /**
     * 切換按鈕的狀態、文字和樣式。
     * @param {HTMLElement} button - 目標按鈕元素。
     * @param {boolean} isActive - 目前是否為啟用狀態。
     * @param {object} options - 包含狀態文字和樣式的物件。
     * @param {string} options.activeText - 啟用狀態的文字。
     * @param {string} options.inactiveText - 非啟用狀態的文字。
     * @param {string} options.activeClass - 啟用狀態的 CSS class。
     * @param {string} options.inactiveClass - 非啟用狀態的 CSS class。
     */
    _toggleButtonState(button, isActive, { activeText, inactiveText, activeClass, inactiveClass }) {
        button.innerText = isActive ? activeText : inactiveText;
        button.className = isActive ? activeClass : inactiveClass;
    }

    /** 
     * 處理地圖拖曳啟用/停止的點擊事件。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    handleDragable(e) {
        this.isMapDraggable = !this.isMapDraggable;
        this._toggleButtonState(e.currentTarget, this.isMapDraggable, { activeText: "停止移動地圖", inactiveText: "啟用移動地圖", activeClass: "button1", inactiveClass: "button" });
        if (this.isMapDraggable) {
            SwmmMap.dragging.enable();
        } else {
            SwmmMap.dragging.disable();
        }

    }

    /** 
     * 縮小節點圓圈的半徑並重繪。
     */
    ShrinkNodeCircle() {
        this.node_radius -= 1.0;
        RedrawNodeCircles(this.node_radius);
    }

    /** 
     * 處理繪製/清除子集水區的點擊事件。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    DrawSubcatchments(e) {
        this.isSubcatchmentsDrawn = !this.isSubcatchmentsDrawn;
        this._toggleButtonState(e.currentTarget, this.isSubcatchmentsDrawn, { activeText: "清除子集水區", inactiveText: "繪製子集水區", activeClass: "button", inactiveClass: "button1" });
        if (this.isSubcatchmentsDrawn) {
            DrawSubcatchmentBoundary();
        } else {
            ClearSubcatchments();
        }
    }

    /** 
     * 處理繪製/清除路徑圖的點擊事件。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    handleDrawPath(e) {
        this.isPathDrawn = !this.isPathDrawn;
        this._toggleButtonState(e.currentTarget, this.isPathDrawn, { activeText: "清除路徑線", inactiveText: "繪製路徑線", activeClass: "button", inactiveClass: "button1" });
        if (this.isPathDrawn) {
            DrawPaths(SwmmMap, Path.data, Base.data);
            DrawSingleDFSPath(SwmmMap, DFS_path, Base.data);
        } else {
            ClearAllPaths();
            ClearDFSPath();
        }

    }

    /** 
     * 處理DFS亂數路徑搜尋的點擊事件。
     */
    handleDFSShuffle() {
        // 清除動畫
        ClearAimatePath();
        // 從 UI 元素獲取起始和結束節點
        let StartNode = document.getElementById("user-FromNode").value;
        let EndNode = document.getElementById("user-EndNode").value;

        // trim
        StartNode = StartNode.trim();
        EndNode = EndNode.trim();

        // 繪製起點標記
        if (StartNode) {
            LookNode_OLD(SwmmMap, Base.data, StartNode,
                { icon: RedIcon, clearPrevious: true });
        }
        // 繪製終點標記
        if (EndNode) {
            LookNode_OLD(SwmmMap, Base.data, EndNode,
                { icon: VioletIcon, clearPrevious: false });
        }

        let pathNodes = RunDFSShuffle(StartNode, EndNode);
        if (pathNodes === undefined) return;

        // 根據NodeCsv節點串列 找到管段名稱串列
        DFS_path = findLinkidsFromNodeNames(pathNodes);

        console.log("DFS_path:", DFS_path);
        if (DFS_path.length === 0) {
            myAlert("找不到路徑上的管段資料!", REDCOLOR);
            return;
        }

        // 繪製DFS路徑圖
        DrawSingleDFSPath(SwmmMap, DFS_path, Base.data);
        this._resetAndEnableAnimationButton();
        this._setPathDrawnState(true);

    }
    /** 
     * 處理查詢節點的點擊事件。
     */
    handleLookNode() {
        let nodeId = this.userNodeNameInput.value;
        LookNode(SwmmMap, Base.data, nodeId);
    }
    /** 
     * 處理Dijkstra搜尋兩點間最短路徑的點擊事件。
     */
    async handleShortestPath() {
        // 清除動畫
        ClearAimatePath();
        // 隱藏縱剖面
        $(".chart-container").hide();
        // 切換狀態並更新按鈕
        this.isProfileVisible = false;
        this._toggleButtonState(this.toggleProfileButton, this.isProfileVisible, {
            activeText: "隱藏縱剖面",
            inactiveText: "繪製縱剖面",
            activeClass: "button1",
            inactiveClass: "button"
        });

        // 檢查是否輸入資料
        let StartNode = document.getElementById("user-FromNode").value; //"RD71RD70_03";
        let EndNode = document.getElementById("user-EndNode").value;
        
        // 繪製起點標記
        if (StartNode) {
            LookNode_OLD(SwmmMap, Base.data, StartNode,
                { icon: RedIcon, clearPrevious: true });
        }
        // 繪製終點標記
        if (EndNode) {
            LookNode_OLD(SwmmMap, Base.data, EndNode,
                { icon: VioletIcon, clearPrevious: false });
        }

        let project_id = "TY_DMCREEK";
        let res = await GetShortestPathFromCJServer(project_id);

        // 檢查 API 回應。如果 `res` 為 null 或空陣列，表示發生錯誤或找不到路徑。
        // GetShortestPathFromCJServer 內部已處理錯誤提示，這裡只需中止後續操作。
        if (!res || res.length === 0) {
            console.error("未能獲取最短路徑資料，處理程序已中止。");
            this._setPathDrawnState(false); // 確保按鈕狀態正確
            return;
        }

        // 成功獲取資料，開始處理
        StoreProfileData(res);
        // 從路徑上的節點名稱找到管段資料
        let pathData = findLinkidsFromNodeNames(res[0]['NodeIds']);
        if (pathData.length === 0) {
            myAlert("找不到路徑上的管段資料!", REDCOLOR);
            return;
        }
        // 繪製DFS路徑圖
        DrawSingleDFSPath(SwmmMap, pathData, Base.data);
        this._resetAndEnableAnimationButton();
        this._setPathDrawnState(true);

    }
    /**
     * 處理DFS搜尋所有可能路徑的點擊事件。
     * @returns {Promise<void>}
     */
    async handleDFSAllPaths() {
        // 清除動畫
        ClearAimatePath();

        $(".chart-container").hide();
        this.isProfileVisible = false;
        if (this.toggleProfileButton) {
            this._toggleButtonState(this.toggleProfileButton, this.isProfileVisible, {
                activeText: "隱藏縱剖面",
                inactiveText: "繪製縱剖面",
                activeClass: "button1",
                inactiveClass: "button"
            });
        }

        // 檢查是否輸入資料
        let FromNode = this.fromNodeInput.value;
        let EndNode = this.endNodeInput.value;
        console.log(FromNode, EndNode);

        if (FromNode == undefined || FromNode == null || FromNode.length === 0) {
            myAlert("FromNode is undefined or null or '' !", "red");
            return;
        }
        FromNode = FromNode.trim();
        EndNode = EndNode.trim();

        // 存入Path.data
        Path.data = await DFS_AllPaths(FromNode, EndNode);
        if (Path.data === undefined) return;

        let PathNumber = Path.data.length;
        if (Path.data[0].LinkIds != null) {
            myAlert(`API回傳:${Path.data[0].Message}，共有${PathNumber}條可能路徑`, "green");
            DrawPaths(SwmmMap, Path.data, Base.data);
        } else {
            myAlert(`API回傳:${Path.data[0].Message}`, "red");
        }
        this._resetAndEnableAnimationButton();
        this._setPathDrawnState(true);
    }
    /**
     * 處理Dijkstra演算法搜尋兩點間最短路徑的點擊事件。
     */
    handleDijkstraPath() {
        // 清除動畫
        ClearAimatePath();
        // Dijkstra 演算法搜尋兩點最短路徑

        this._resetAndEnableAnimationButton();
        this._setPathDrawnState(true);
    }
    /** 
     * 處理Dijkstra演算法搜尋所有路徑至出口的點擊事件。
     */
    handleDijkstraAllPaths() {
        // 清除動畫
        ClearAimatePath();
        // 隱藏縱剖面圖
        $(".chart-container").hide();
        this.isProfileVisible = false;
        if (this.toggleProfileButton) {
            this._toggleButtonState(this.toggleProfileButton, this.isProfileVisible, {
                activeText: "隱藏縱剖面",
                inactiveText: "繪製縱剖面",
                activeClass: "button1",
                inactiveClass: "button"
            });
        }

        // 請求所有到達出水口的路徑
        GetDijkstraAllPaths();
        this._resetAndEnableAnimationButton();
        this._setPathDrawnState(true);
    }
    /** 
     * 產生縱剖面下拉選單的 HTML 選項。
     * @param {Array<object>} pathData - 路徑資料陣列。
     * @returns {string} HTML `<option>` 元素字串。
     */
    gen_profile_select(pathData) {
        //console.log("pathData:", pathData)
        let opt = "";
        for (let i = 0; i < pathData.length; i++) {
            opt += `<option>${pathData[i].EndNode}</option>`;
        }
        return opt;
    }

    /**
     * 處理縱剖面下拉選單的變更事件。
     */
    _onProfileSelectChange() {
        // 清除所有最短路徑
        ClearAllPaths();
        const selectElement = document.getElementById("profile-select");
        const projectId = document.getElementById("project-select").value;

        let profile_data = GetProfileData();
        const selectedIndex = selectElement.selectedIndex;
        const selectedPath = profile_data[selectedIndex];

        // 預設為無水位線 (這部分可能需要根據實際邏輯調整)
        let head = BlankForDemo();

        // 繪製縱剖面圖
        Profile_main("Chart_Hydrograph", selectedPath, projectId, false, head);

        // 繪製單一路徑圖
        DrawSinglePath(SwmmMap, selectedPath, Base.data);

        // 更新標題
        const profileChartTitle = gen_ProfileChartTitle(selectedPath);
        document.getElementById('LinkID').innerHTML = `# ${projectId}_${profileChartTitle}`;
    }

    /**
     * 處理繪製/隱藏縱剖面圖的點擊事件。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    handleToggleProfileChart(e) {
        const button = e.currentTarget;
        const willShow = !this.isProfileVisible;

        if (willShow) {
            // --- 顯示縱剖面圖的邏輯 ---
            const profile_data = GetProfileData();

            if (!profile_data || profile_data.length === 0) {
                myAlert("沒有路徑資料!請先執行路徑搜尋!", REDCOLOR, 500);
                return; // 如果沒有資料，則不切換狀態
            }

            $(".chart-container").css("z-index", 410).show();
            const projectId = document.getElementById("project-select").value;

            const head = BlankForDemo();
            Profile_main("Chart_Hydrograph", profile_data[0], projectId, false, head);

            const profileChartTitle = gen_ProfileChartTitle(profile_data[0]);
            const opt = this.gen_profile_select(profile_data);
            document.getElementById('LinkID').innerHTML = `# ${projectId}_${profileChartTitle}`;
            document.getElementById("profile-select-div").innerHTML = `<select id="profile-select">${opt}</select>`;
            document.getElementById("profile-select").addEventListener('change', () => this._onProfileSelectChange());

            $("#hide-Profile").attr('disabled', false);
        } else {
            // --- 隱藏縱剖面圖的邏輯 ---
            $(".chart-container").hide();
        }

        // 切換狀態並更新按鈕
        this.isProfileVisible = willShow;
        this._toggleButtonState(button, this.isProfileVisible, {
            activeText: "隱藏縱剖面",
            inactiveText: "繪製縱剖面",
            activeClass: "button1",
            inactiveClass: "button"
        });
    }

    /** 
     * 處理暫停/繼續動態路徑的點擊事件。
     * @param {MouseEvent} e - 點擊事件物件。
     */
    handleToggleAnimate(e) {
        this.isAnimationPaused = !this.isAnimationPaused;

        // 更新按鈕文字與樣式
        this._toggleButtonState(e.currentTarget, !this.isAnimationPaused, {
            activeText: "暫停動態路徑",    // 播放中顯示的文字
            inactiveText: "繼續動態路徑",  // 暫停時顯示的文字
            activeClass: "button",
            inactiveClass: "button1"
        });

        // 呼叫對應的函式
        if (this.isAnimationPaused) {
            PauseAllPaths();
        } else {
            ResumeAllPaths();
        }
    }
    /** 
     * 處理清除動態路徑的點擊事件。
     */
    handleClearAnimatePath() {
        ClearAimatePath();
        if (this.toggleAnimatePathButton) {
            this.toggleAnimatePathButton.disabled = true;
            this.isAnimationPaused = false; // 重設狀態
            this._toggleButtonState(this.toggleAnimatePathButton, true, { // 重設為播放狀態的外觀
                activeText: "暫停動態路徑",
                inactiveText: "繼續動態路徑",
                activeClass: "button",
                inactiveClass: "button1"
            });
        }
    }

    /** 
     * 處理尋找並繪製指定節點上游集水區的點擊事件。
     */
    handleFindBasins() {
        let EndNode = this.endNodeInput.value;
        console.log("handleFindBasins() for EndNode:", EndNode);

        if (EndNode === undefined || EndNode === null || EndNode.length === 0) {
            myAlert("EndNode is undefined or null or '' !", "red");
            return;
        }
        EndNode = EndNode.trim();

        let totalBasins = new TotalBasins(Base.data['SUBCATCHMENTS'],
            getPNodes(), getPLinks()
        );
        let basins = totalBasins.Find(EndNode);
        console.log("集水區串列=", basins);

        // 繪製終點標記, simple or table
        if (EndNode) {
            LookNode(SwmmMap, Base.data, EndNode, totalBasins, basins,
                {
                    icon: VioletIcon, clearPrevious: true, displayMode: 'table',
                    animate: 'fade'
                });
        }

        // 繪製集水區範圍
        DrawFilteredSubcatchmentBoundary(basins);
    }

    /** 
     * 渲染右側控制面板。
     */
    Render() {
        let content = this.GenPanel();
        render(content, this.container);
        // 渲染後，快取 DOM 元素
        this._initDOMElements();
    }
}

/**
 * 根據節點串列 找到管段名稱串列
 * @param {string[]} pathNodes 
 * @returns {{from:string, to:string, linkid:string}[]} - 排水路徑節點與管段名稱物件
 */
function findLinkidsFromNodeNames(pathNodes) {
    let path_data = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
        let from = pathNodes[i];
        let to = pathNodes[i + 1];
        let link = Base.getLinkByFromTo(from, to);
        let item = {};
        item['from'] = from;
        item['to'] = to;
        item['linkid'] = link[0];
        path_data.push(item);
    };
    return path_data;
}