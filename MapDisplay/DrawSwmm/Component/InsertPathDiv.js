// InsertPathDiv.js
// 2023-12-03
// 生成路徑儲存至資料庫的視窗組件

import { RequestInsPath } from "../../RequestData.js";

/**
 * 生成路徑儲存至資料庫的視窗組件
 * @param {string} message
 * @param {string} User_NodeCSV 
 * @returns
 */
export function InsertPathDiv(message, User_NodeCSV) {

    const div = document.createElement("div");

    div.innerHTML = message;

    // 新增輸入框
    const form = document.createElement("form");
    let projectId = document.getElementById("project-select").value;
    // 起點
    let FromNode = document.getElementById("user-FromNode").value;
    // 終點
    let EndNode = document.getElementById("user-EndNode").value;
    // 路徑名稱 : ex.'D19~D13'
    let Prof_id = `${FromNode}~${EndNode}`;

    let inputHTML = `
        <div class="input-group input-group-sm mb-1">
            <span class="input-group-text" id="inputGroup-sizing-sm">專案名稱</span>
            <input id="input-projid" type="text"
                   class="form-control" placeholder = "專案名稱"
                   value=${projectId}
                   aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" required>
            </div>
        <div class="input-group input-group-sm mb-1">
            <span class="input-group-text" id="inputGroup-sizing-sm">縱剖面名稱</span>
            <input id="input-profid" type="text"
                   class="form-control" placeholder = "縱剖面名稱"
                   value=${Prof_id}
                   aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" required>
        </div>
         <div class="input-group input-group-sm mb-1">
            <span class="input-group-text" id="inputGroup-sizing-sm">使用者名稱</span>
            <input id="input-userid" type="text"
                   class="form-control" placeholder = "user name"
                   aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" required>
        </div>`
    form.innerHTML = inputHTML;

    const button = document.createElement("input");
    button.type = "submit";
    button.classList.add('btn');
    button.classList.add('btn-sm');
    button.classList.add('bg-primary');
    button.classList.add("mt-1");
    button.value = "存入資料庫";

    // 註冊按鈕
    button.onclick = function (e) {
        let el = document.getElementById("input-userid");
        let userid = el.value.trim();

        if (userid.length > 0) {
            el.classList.add("was-validated");
            el.classList.remove("is-invalid");
            console.log("Saving Profile for userid:", userid);
            // 取得使用者輸入文字
            let projectId = $("#input-projid").val();
            let profId = $("#input-profid").val();
            // 向後端請求資料, 資料夾是相對於html
            RequestInsPath(projectId, profId, User_NodeCSV, userid);
        }
        else {
            el.classList.remove("was-validated");
            el.classList.add("is-invalid");
            console.error("請輸入使用者名稱");
            return;
        }
    }

    // 避免Form submit後刷新頁面
    function handleForm(event) { event.preventDefault(); }
    form.addEventListener('submit', handleForm);

    // 把按鈕放在form裡面
    form.appendChild(button);
    div.appendChild(form);

    //div.appendChild(button);
    return div;
}