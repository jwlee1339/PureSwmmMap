// utils.js
// 2023-07-15

export class Utils {

    // global variables
    static Taiwan_UTC = +8; // UTC+8 in hours
    /**
     * 偵測是否可使用 WebView。
     * @returns {boolean} 如果可用則返回 true，否則返回 false。
     */
    static IsWebViewAvailable() {
        if (window.chrome && window.chrome.webview) return true;
        else return false;
    }
    /**
     * 檢查日期時間字串是否有效。
     * @param {string} dateString - 日期時間字串，例如 "2022-10-16 15:00"。
     * @returns {boolean} 如果字串是有效的日期時間，則返回 true，否則返回 false。
     */
    static IsValidDateTime(dateString) {
        let date = new Date(dateString);
        let res = date instanceof Date && !isNaN(date.valueOf());
        // console.log(`IsValidDateTime(${dateString}):`,res);
        return res;
    }

    /**
     * 在二維陣列中尋找第二個元素的最小值和最大值。
     * @param {number[][]} array - 輸入的二維陣列，例如 [[t1, v1], [t2, v2], ...]。
     * @returns {number[]} - 包含 [最小值, 最大值] 的陣列。
     */
    static FindMinMax(array) {
        let min = 9999;
        let max = -9999;

        for (let i = 0; i < array.length; i++) {
            min = Math.min(min, array[i][1]);
            max = Math.max(max, array[i][1]);
        }
        return [min, max];
    }

    /**
     * 在陣列中尋找最小值及其索引。
     * @param {[any, number][]} array - 輸入的陣列，格式為 [[tm, value],...]。
     * @returns {{min: number, index: number}} - 包含最小值和其索引的物件。
     */
    static FindMin(array) {
        let min = Number.MAX_VALUE;
        let index = -1;

        if (array === null || array.length === 0) return { min, index };

        for (let i = 0; i < array.length; i++) {
            if (min > +array[i][1]) {
                min = +array[i][1];
                index = i;
            }
        }
        return { min, index };
    };

    /**
     * 在陣列中尋找最大值及其索引。
     * @param {[any, number][]} array - 輸入的陣列，格式為 [[tm, value],...]。
     * @returns {[number, number]} - 包含 [最大值, 索引] 的陣列。
     */
    static FindMax = (array) => {
        if (array === null || array.length === 0)
            return [-999.9, -999.9];
        let maxvalue = -999.9;
        let index = -1;
        for (let i = 0; i < array.length; i++) {
            if (maxvalue < array[i][1]) {
                maxvalue = array[i][1];
                index = i;
            }
        }
        return [maxvalue, index];
    };

    /**
     * 為給定的日期增加指定的分鐘數。
     * @param {Date} date - 原始日期物件。
     * @param {number} m - 要增加的分鐘數。
     * @returns {Date} - 新的日期物件。
     */
    static addMinutes(date, m) {
        let copiedDate = new Date(date.getTime());
        copiedDate.setMinutes(copiedDate.getMinutes() + m);
        return copiedDate;
    }
    /**
     * 為給定的日期增加指定的小時數。
     * @param {Date} date - 原始日期物件。
     * @param {number} h - 要增加的小時數。
     * @returns {Date} - 新的日期物件。
     */
    static addHours(date, h) {
        var copiedDate = new Date(date.getTime());
        copiedDate.setHours(copiedDate.getHours() + h);
        return copiedDate;
    }

    /**
     * 將日期字串 "YYYY-MM-DD HH:MM" 轉換為 "YYYYMMDDHHMM" 格式。
     * @param {string} date_string - 日期字串，例如 "2022-10-16 11:00"。
     * @returns {string} - 格式化後的字串。
     */
    static StrToYYYYMMDDHH(date_string) {
        console.log(date_string)
        let date = Utils.StringToDateTime(date_string);
        console.log({ date })
        // @ts-ignore
        let YYYYMMDDHH = Utils.DateToYYYYMMDDHHMM(date);
        return YYYYMMDDHH;
    }

    /**
     * 將日期字串 "YYYY-MM-DD HH:MM" 轉換為 "YYYYMMDDHH" 格式。
     * @param {string} date_string - 日期字串，例如 "2022-10-16 11:00"。
     * @returns {string} - 格式化後的字串。
     */
    static StrToYYYYMMDDHH00(date_string) {
        // console.log(date_string)
        let date = Utils.StringToDateTime(date_string);
        // console.log({date})
        // @ts-ignore
        let YYYYMMDDHH00 = `${Utils.DateToYYYYMMDDHH(date)}`;
        return YYYYMMDDHH00;
    }
    /**
     * 將 Date 物件轉換為 "YYYYMMDDHHMM" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHHMM(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let res = `${yyyy}${mm}${dd}${hh}${min}`;
        return res;
    }
    /**
     * 將 Date 物件轉換為 "YYYYMMDDHH00" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHH00(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = "00";
        let res = `${yyyy}${mm}${dd}${hh}${min}`;
        return res;
    }
    /**
     * 將 Date 物件轉換為 "YYYY-MM-DD HH:MM" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHHMM_Dash(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let res = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        return res;
    }
    /**
     * 將 Date 物件轉換為 "YYYY-MM-DD HH:M0" 格式的字串 (分鐘數會被調整到最近的10分鐘)。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHHM0_Dash(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let t = date.getMinutes();

        t = Math.floor(t / 10) * 10;

        let min = t < 10 ? "0" + t : t;
        let res = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        return res;
    }
    /**
     * 將 Date 物件轉換為 "MM-DD HH:MM" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToMMDDHHMM_Dash(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let res = `${mm}-${dd} ${hh}:${min}`;
        return res;
    }

    /**
     * 將 Date 物件轉換為 "YYYY-MM-DD" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDD_Dash(date) {
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let res = `${yyyy}-${mm}-${dd}`;
        return res;
    }

    /**
     * 將 Date 物件轉換為 "YYYY-MM-DD HH:MM:SS" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHHMMSS_Dash(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        let res = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
        return res;
    }

    /**
     * 將 Date 物件轉換為 "YYYY-MM-DD HH:00" 格式的字串。
     * @param {Date} date - Date 物件。
     * @returns {string} - 格式化後的字串。
     */
    static DateToYYYYMMDDHH00_Dash(date) {
        // date to yyyymmddhhmm
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        let min = "00";
        let res = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        return res;
    }

    /**
     * 在 Flot 圖表上增加註記。
     * @param {any} plot - Flot plot 物件。
     * @param {JQuery<HTMLElement>} placeholder - 圖表的 jQuery placeholder 物件。
     * @param {number} tm - 註記的時間戳 (x 座標)。
     * @param {number} maxValue - 註記的 y 座標值。
     * @param {string} text - 要顯示的註記文字。
     */
    static AddStageAnnotation = function (plot, placeholder, tm, maxValue, text) {
        var o = plot.pointOffset({ x: tm, y: maxValue });
        // let text = "�[��";
        let ctx = plot.getCanvas().getContext("2d"); // get the context
        // let metrics = ctx.measureText(text);
        // let top = o.top - metrics.height;
        let top = o.top - 15;

        placeholder.append("<div style='position:absolute;left:" +
            (o.left) +
            "px;top:" +
            top +
            `px;color:#000;font-size:smaller'>${text}</div>`);
        // drawing
        ctx.beginPath();

    };
    // --------------------------- String -> Date --------------------------------
    /**
     * 將 "YYYY-MM-DD HH:MM" 格式的字串轉換為 Date 物件。
     * @param {string} dateTimeString - 日期時間字串。
     * @returns {Date} - Date 物件。
     */
    static StringToDateTime = function (dateTimeString) {
        //console.log(`StringToDateTime(), dateTimeString=${dateTimeString}`);
        function RemoveLeadingZero(numberInStringType) {
            let i = 0;
            while (true) {
                if (numberInStringType[i] === '0' && i !== numberInStringType.length - 1)
                    numberInStringType = numberInStringType.substring(1);
                else
                    return numberInStringType;
            }
        }
        let dateTimeSplit = dateTimeString.split(/[\s-:]/);
        let year = parseInt(dateTimeSplit[0]);
        let month = parseInt(RemoveLeadingZero(dateTimeSplit[1])) - 1;
        let date = parseInt(RemoveLeadingZero(dateTimeSplit[2]));
        let hours = parseInt(RemoveLeadingZero(dateTimeSplit[3]));
        let minutes = parseInt(RemoveLeadingZero(dateTimeSplit[4]));
        let datetime = new Date(year, month, date, hours, minutes);
        return datetime;
    };
    /** FetchData(): 讀取資料 
     * @param {string} URL - API 的網址及參數。
     * @param {number} timeout - 超時時間 (毫秒)。
     * @returns {Promise<[string, any]>} - 返回一個 Promise，成功時解析為 ["OK", data]，失敗時為 ["NG", null]。
     */
    static async FetchData(URL, timeout) {
        // 創建一個 AbortController 物件
        const controller = new AbortController();

        // 設置一個 5 秒的超時計時器
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // 檔案位置相對於網頁HTML
        try {
            // 使用 await 等待 fetch 函數的返回值
            const response = await fetch(URL, { signal: controller.signal });
            if (!response.ok) {
                console.error('Network response was not ok');
                return ["NG", null];
            }
            // 使用 await 等待 json () 方法的返回值
            const data = await response.json();
            // 回傳 JSON 數據
            return ["OK", data];
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
        return ["NG", null];
    }
}