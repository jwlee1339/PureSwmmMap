// myAlert.js
// 2021-12-23


export let GREENCOLOR = "#4CAF50";
export let REDCOLOR = "#f44336";
export let BLUECOLOR = "#2196F3";
export let ORANGECOLOR = "#ff9800";
export let YELLOWCOLOR = "#d2be0e";

let alertTimer = null;

/**警告視窗
 * @param {string} contents
 * @param {string} color
 * @param {number} outtime 持續時間(毫秒), 預設為3000毫秒
 */
export function myAlert(contents="NoMessage", color="#eee", outtime=3000) {
    outtime = outtime || 3000;
    const alertElement = $("#alertMessage");

    // 清除上一個計時器，防止舊的提示框關閉新的提示框
    if (alertTimer) {
        clearTimeout(alertTimer);
    }

    // 準備新的提示框：設定內容、樣式，並移除舊的動畫class
    alertElement
        .html(contents)
        .css("background-color", color)
        .removeClass('my-alert-animate-in my-alert-animate-out')
        .show();

    // 強制瀏覽器重繪，以確保動畫可以重新觸發
    // https://css-tricks.com/restart-css-animation/
    void alertElement[0].offsetWidth;

    // 加入 'in' 動畫 class
    alertElement.addClass('my-alert-animate-in');

    // 設定計時器，在指定時間後觸發 'out' 動畫
    alertTimer = setTimeout(() => {
        alertElement
            .removeClass('my-alert-animate-in')
            .addClass('my-alert-animate-out')
            .one('animationend', function() {
                // 在 'out' 動畫結束後，隱藏元素並移除class
                $(this).hide().removeClass('my-alert-animate-out');
            });
        alertTimer = null;
    }, outtime);
}
