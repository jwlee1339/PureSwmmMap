// UserTable.js
// 2023-12-04
// 製作路徑表 - div 版本

// 動態排水路徑, [繪製] [重新開始動畫] [停止動畫] [清除]
import { DrawSingleAnimatePath, ReStartAimatePath, StopAimatePath, ClearAimatePath } from "../DrawSwmm/AnimatePath.js";
import { myAlert, BLUECOLOR, REDCOLOR, ORANGECOLOR, GREENCOLOR } from "../myAlert.js";
// 繪圖用的路徑資料
import { GetProfileData } from "../GetPathData.js";
import { Base } from "../GetBaseData.js";
// 繪製排水路徑
import { ClearAllPaths, DrawPaths, DrawSinglePath } from "../DrawSwmm/DrawPath.js"
import { SwmmMap, StartDrawSwmm, drawSubcatchments, ClearAllNodes, ClearAllLinks, drawDMBorder } from "../MapResults/SwmmMapService.js";

// 繪製動態路徑按鈕
let draw_animated_path_el = document.getElementById("draw-animate-path");


export class UserTable {

    constructor(dom) {
        this.dom = dom;
        this.Template = "";
        // 儲存使用者的選擇
        this.user_id = "jwlee";
        // 使用者指定路徑表
        this.table_el;
    }

    data = [
        {
            "Proj_id": "TY_DMCREEK",
            "Prof_id": "SB15-2~TS-T2",
            "Nodes": "SB15-2,SB15-1,S15,S14-1-1,S14-3,S14-2,S14-1,TS-T17,TS-T16,TS-T15,TS-T14,TS-T13,TS-T12,TS-T11,TS-T10,TS-T9,TS-T8,TS-T7,TS-T6,TS-T5,TS-T4,TS-T3,TS-T2",
            "Userid": "jwlee",
            "Insdatetime": "2023-12-01 17:05:26"
        }
    ];
    /**
     * 刪除使用者指定路徑
     * @param {number} index 
     */
    deleteRow(e) {
        console.log("deleteRow(), before deleteRow(), this.data.length=", this.data.length);
        if (this.data.length > 0) {
            //this.data.splice(index, 1);
            let s = e.target.value;
            console.log("deleteRow(), s=", s)
            // 1.取得專案名稱、使用者名稱、路徑節點
            let path = JSON.parse(s);

            // Remove this record
            const index = this.data.indexOf(path);
            if (index > -1) {
                this.data.splice(index, 1);
                console.log(`刪除紀錄, index=${index}`);
            }
            // 向後端請求刪除紀錄
            let projectId = path['projid'];
            let ProfId = path['profid'];
            let request = `DeletePath?ProjID=${projectId}&ProfId=${ProfId}`;
            console.log(request)
            // Triggered by a button on the HTML page
            window.chrome.webview.postMessage(`${request}`);

        }
    }
    /**
     * 生成card & input & 表格
     * @returns
     */
    getTemplate() {
        let projectId = document.getElementById("project-select").value;
        return `
        <div class="card shadow"  style="cursor: default; width:610px;">
            <div class="card-header text-white bg-primary p-1">
                <div class="d-flex justify-content-between">
                    <div class="fs-6">動態產生網頁表格</div>
                    <button id="user-close" class="btn btn-sm bg-success">X</button>
                </div>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-center">
                    <div class="col-auto">
                    <div class="input-group input-group-sm mb-3">
                        <span class="input-group-text">專案</span>
                        <input id="user-project-id" type="text" class="form-control" value="${projectId}" width=80>
                    </div>
                    </div>
                    <div class="col-auto">
                    <div class="input-group input-group-sm mb-3">
                        <span class="input-group-text">使用者</span>
                        <input id="user-userid" type="text" class="form-control" value="${this.user_id}" width=80>
                    </div>
                    </div>
                    <div class="col-auto">
                    <div class="input-group input-group-sm mb-3">
                        <button id="query-user-table" class="btn btn-sm bg-primary">查詢</button>
                    </div>
                    </div>
                    
                </div>
                
                <div id="inner-table" class="table-responsive"></div>
            </div>

        </div>
      `;
    }

    ShowData(UserPaths) {

        console.log("ShowData(), UserPaths:", UserPaths)
        this.data = [];
        for (let i = 0; i < UserPaths.length; i++) {
            let projid = UserPaths[i].Proj_id;
            let profid = UserPaths[i].Prof_id;
            let nodes = UserPaths[i].Nodes;
            let userid = UserPaths[i].Userid;
            // let insdatetime = user[i].Insdatetime;
            this.data.push({ projid, profid, nodes, userid });
        }
        this.render();
    }

    Refresh() {
        document.getElementById("inner-table").removeChild(this.table_el);
        this.render();
    }


    HandleDrawChartButton(e) {
        let s = e.target.value;
        //console.log(e.target.innerText, s);
        // 1.取得專案名稱、使用者名稱、路徑節點
        let path = JSON.parse(s);
        //console.log(path);
        let proj_id = path['projid'];
        let prof_id = path['profid'];
        let userid = path['userid'];
        let nodes = path['nodes'];
        console.log(proj_id, userid, nodes);

        // 2.呼叫後台取得繪圖用的路徑資料
        // -----
        // 將nodes轉換為CSV
        let NodeCsv = nodes.toString(",");

        // 讀取繪圖用的路徑資料
        // 改為webview2 version
        //* 向後端請求節點與管渠基本資料 繪圖用的路徑資料
        let request = `DFSShuffle?ProjID=${proj_id}&NodeCsv=${NodeCsv}`;
        // Triggered by a button on the HTML page
        window.chrome.webview.postMessage(`${request}`);

        // 啟用動態路徑按鈕
        // draw_animated_path_el.disabled = false;
        // -----
    }
    /**
     * 
     * @returns {HTMLTableElement}
     */
    genProfileTable() {

        const table = document.createElement("table");
        table.className = "table align-middle table-bordered table-hover table-striped table-sm fixed-table";
        table.innerHTML = `
            <thead>
              <tr class="text-center">
                <th>專案</th>
                <th>路徑</th>
                <th>節點</th>
                <th>使用者</th>
                <th width=100 class="text-center">操作</th>
              </tr>
            </thead>`;
        const tbody = document.createElement('tbody');

        for (let i = 0; i < this.data.length; i++) {
            const tr = document.createElement("tr");
            tr.className = "text-center";
            let row = this.data[i];
            let keys = Object.keys(row);
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                const td = document.createElement("td");
                td.className = "fixed-td";
                td.innerText = row[key];
                tr.appendChild(td);
            }
            // 最後一個column
            const td = document.createElement("td");
            td.className = "fixed-td";

            // botton1 : [刪除]
            const button1 = document.createElement("button");
            button1.classList.add('btn');
            button1.classList.add('btn-sm');
            button1.classList.add('bg-danger');
            button1.classList.add("mt-1");
            // 儲存物件
            button1.value = JSON.stringify(row);
            // 提供button 取得row index
            button1.innerText = "刪除";
            // 註冊按鈕
            button1.onclick = (e) => {
                console.log(e.target.innerText, e.target.value);
                this.deleteRow(e);
            }

            // botton2 : [繪圖]
            const button2 = document.createElement("button");
            button2.classList.add('btn');
            button2.classList.add('btn-sm');
            button2.classList.add('bg-success');
            button2.classList.add("mt-1");
            button2.classList.add("mx-1")

            // 提供button 取得指定資料
            // 注意JSON.stringify() 會將key的大寫轉為小寫、刪除'_'
            button2.value = JSON.stringify(row);
            button2.innerText = "繪圖";
            // 註冊按鈕
            button2.onclick = (e) => {
                this.HandleDrawChartButton(e);
            }

            td.appendChild(button1);
            td.appendChild(button2);
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
    }

    render() {
        this.table_el = this.genProfileTable();

        let div = document.createElement("div");

        div.innerHTML = this.getTemplate();

        document.getElementById(this.dom).innerHTML = "";
        document.getElementById(this.dom).appendChild(div);

        document.getElementById("inner-table").appendChild(this.table_el);
        // todo "query-user-table" .click
        document.getElementById("query-user-table").onclick = () => {
            let projectId = $("#user-project-id").val();
            let requestStr = `QueryPath?ProjID=${projectId}&ProfId=`;
            console.log(requestStr);
            // Triggered by a button on the HTML page
            window.chrome.webview.postMessage(`${requestStr}`);
        }
        // close
        document.getElementById("user-close").onclick = () => {
            // 編輯路徑資料表格
            let user_paths_edit_table_el = document.getElementById("user-paths-edit-table");
            console.log("user-close btn clicked!");
            user_paths_edit_table_el.classList.add("hide-right-panel");
            user_paths_edit_table_el.classList.remove("show-right-panel");
            // 編輯路徑資料按鈕
            let open_path_edit_panel_el = document.getElementById("open-path-edit-panel");
            // 按鈕的顏色
            open_path_edit_panel_el.classList.remove("bg-danger");
            open_path_edit_panel_el.classList.add("bg-primary");
            open_path_edit_panel_el.innerText = "開啟路徑編輯表";
        }
    }
}
