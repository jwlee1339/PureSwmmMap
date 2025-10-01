// DFS_AllPaths.js
// 2023-11-27

import { myAlert, REDCOLOR } from "./myAlert.js";

/**
 * DFS_AllPaths.js
 * @param {string} FromNode
 * @param {string} EndNode
 * @returns {Promise}
 */
export function DFS_AllPaths(FromNode, EndNode) {

    let projectId = document.getElementById("project-select").value;
    if (FromNode === undefined) {
        myAlert("StartNode不可為undefinded!", REDCOLOR);
        return;
    }
    if (EndNode === undefined) {
        myAlert("EndNode不可為undefinded!", REDCOLOR);
        return;
    }
    console.log(FromNode, EndNode);

    let URL = `./SwmmMap/MapDisplay/asp/DFSPath.aspx?ProjID=${projectId}&StartNode=${FromNode}&EndNode=${EndNode}`;

    // let URL = "./MapDisplay/Data/DFS_Paths.json";
    console.log(URL);

    let indicator = document.getElementById("Load-indicator1");
    indicator.innerHTML = `<span class="gadge bg-warning text-black">讀取中...</span>`;

    // disable buttons
    let btns = document.getElementsByClassName("button");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    };

    let a = fetch(URL)
        .then(function (response) {
            if (response.status >= 200 && response.status <= 299) {
                return response.json();
            } else {
                throw Error(response.statusText);
            }
        })
        .then(function (json) {
            return json;
        }).catch(x => {
            console.log('Error in fetch or time out = 10 seconds. message : ', x);
        }).finally(() => {
            indicator.innerText = "";
            for (let i = 0; i < btns.length; i++) {
                btns[i].disabled = false;
            };
        });
    return a;
}