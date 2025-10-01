// MyUtils.js
// 2023-09-05

export class MyUtils {

    // global variables
    Taiwan_UTC = +8; // UTC+8 in hours

    /**
     * 檢查是否為合法的日期時間格式
     * @param {string} dateString ex."2022-10-16 15:00"
     */
    static IsValidDateTime(dateString) {
        let date = new Date(dateString);
        let res = date instanceof Date && !isNaN(date.valueOf());
        // console.log(`IsValidDateTime(${dateString}):`,res);
        return res;
    }

    /**
         *  find min. and max. of runoff
         * @param {number[][]} array 
         * @returns 
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

    // find maximum balue of array
    // array : [[tm, value],...]
    // return with : [maxvalue, index]
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

    // add minutes
    /**
     * @param {Date} date
     * @param {number} m
     */
    static addMinutes(date, m) {
        let copiedDate = new Date(date.getTime());
        copiedDate.setMinutes(copiedDate.getMinutes() + m);
        return copiedDate;
    }
    /**
     * add hours
     * @param date 日期
     * @param h 小時
     * @returns
     */
    static addHours(date, h) {
        var copiedDate = new Date(date.getTime());
        copiedDate.setHours(copiedDate.getHours() + h);
        return copiedDate;
    }

    /**
     * "2022-10-16 11:00" 轉換為"YYYYMMDDHH"
     * @param {string} date_string
     */
    static StrToYYYYMMDDHH(date_string) {
        console.log(date_string)
        let date = StringToDateTime(date_string);
        console.log({ date })
        // @ts-ignore
        let YYYYMMDDHH = date.yyyymmddhh();
        return YYYYMMDDHH;
    }

    /**
     * "2022-10-16 11:00" 轉換為"YYYYMMDDHH00"
     * @param {string } date_string
     */
    static StrToYYYYMMDDHH00(date_string) {
        // console.log(date_string)
        let date = StringToDateTime(date_string);
        // console.log({date})
        // @ts-ignore
        let YYYYMMDDHH00 = `${date.yyyymmddhh()}00`;
        return YYYYMMDDHH00;
    }
    /**
     * Date -> YYYYMMDDHHMM
     * @param date 
     * @returns string
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
     * Date -> YYYYMMDDHHMM00
     * @param date 
     * @returns string
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
     * Date -> YYYY-MM-DD HH:MM
     * @param date 
     * @returns string
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
     * Date -> YYYY-MM-DD HH:MM
     * @param date 
     * @returns string
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
     * Date -> YYYY-MM-DD
     * @param date 
     * @returns string
     */
    static DateToYYYYMMDD_Dash(date) {
        let yyyy = date.getFullYear();
        let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
        let dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        let res = `${yyyy}-${mm}-${dd}`;
        return res;
    }

    /**
     * Date -> YYYY-MM-DD HH:MM:SS
     * @param date 
     * @returns string
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
     * Date -> YYYY-MM-DD HH:M0
     * @param date 
     * @returns string
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
     * Date -> YYYY-MM-DD HH:00
     * @param date 
     * @returns string
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

    // add notation on flot chart
    // text = "觀測"
    // @ts-ignore
    static AddStageAnnotation = function (plot, placeholder, tm, maxValue, text) {
        var o = plot.pointOffset({ x: tm, y: maxValue });
        // let text = "觀測";
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
    // --------------------------- 處理日期時間的函數 --------------------------------
    /**
     * 字串轉換為Date
     * @param {string} dateTimeString , ex. "2023-09-05 12:10"
     * @returns 
     */
    static StringToDateTime = function (dateTimeString) {
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
}