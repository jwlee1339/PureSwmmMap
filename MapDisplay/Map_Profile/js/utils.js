// utils.js
// 2021-10-26


// find maximum balue of array
// array : [[tm, value],...]
// return with : [maxvalue, index]

export var FindMax = function (array) {
    if (array === null || array.length === 0) return [-999.9, -999.9];

    let maxvalue = -999.9;
    let index = -1;

    for (let i = 0; i < array.length; i++) {
        if (maxvalue < array[i][1]) {
            maxvalue = array[i][1];
            index = i;
        }
    }
    return [maxvalue, index];
}

/// global variables
export var Taiwan_UTC = +8;  // UTC+8 in hours


// add notation on flot chart

export var AddObsFcstAnnotation = function (plot, placeholder, tm, maxValue) {
    var o = plot.pointOffset({ x: tm, y: maxValue });
    let top = o.top - 30;

    placeholder.append(
        "<div style='position:absolute;left:" +
        (o.left + 4) +
        "px;top:" +
        top +
        "px;color:#000;font-size:smaller'>預報</div>"
    );

    placeholder.append(
        "<div style='position:absolute;left:" +
        (o.left - 28) +
        "px;top:" +
        top +
        "px;color:#000;font-size:smaller'>觀測</div>"
    );

    // drawing

    let ctx = plot.getCanvas().getContext("2d");
    ctx.beginPath();
    // right
    o.left += 4;
    ctx.moveTo(o.left, top);
    ctx.lineTo(o.left, top - 10);
    ctx.lineTo(o.left + 10, top - 5);
    ctx.lineTo(o.left, top);
    ctx.fillStyle = "#000";
    ctx.fill();
    // left
    o.left -= 8;
    ctx.moveTo(o.left, top);
    ctx.lineTo(o.left, top - 10);
    ctx.lineTo(o.left - 10, top - 5);
    ctx.lineTo(o.left, top);
    ctx.fillStyle = "#000";
    ctx.fill();
};

// --------------------------- 處理日期時間的函數 --------------------------------

export var StringToDateTime = function (dateTimeString) {

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
}


// ------------------------------------------
// integer to string, 0 -> "00", 10 -> "10"
// ------------------------------------------
export function itos2(value) {
    let s;
    if (+value < +10)
        s = '0' + String(value);
    else
        s = String(value);
    return s;
}