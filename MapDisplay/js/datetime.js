/* C:\web\playground\SWMM_Web\Web\datetime.js
*
*/
'use strict';

// add minutes
Date.prototype.addMinutes = function (m) {
    var copiedDate = new Date(this.getTime());
    copiedDate.setMinutes(copiedDate.getMinutes() + m);
    return copiedDate;
};

// add hours
Date.prototype.addHours = function (h) {
    var copiedDate = new Date(this.getTime());
    copiedDate.setHours(copiedDate.getHours() + h);
    return copiedDate;
}

// date to yyyy/mm/dd hh:00
// modified at 2021-06-19

Date.prototype.yyyymmddhh00 = function () {
    let yyyy = this.getFullYear();
    let mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    mm = "-" + mm;
    let dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    dd = "-" + dd;
    let hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
    hh = " " + hh;

    let min = 10 * Math.floor(this.getMinutes() / 10);

    let tmp = min < 10 ? "0" + min.toString() : min.toString();
    // number.toString(base)
    let min_str = ":" + tmp;

    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min_str);
};


// date to yyyymmddhhmm
Date.prototype.yyyymmddhhmm = function () {
    var yyyy = this.getFullYear();
    var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    var hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
    var min = this.getMinutes() < 10 ? "0" + this.getMinutes() : this.getMinutes();
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min);
};
// date to yyyy/mm/dd hh:00
Date.prototype.yyyymmddhhSlash = function () {
    var yyyy = this.getFullYear();
    var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    mm = "-" + mm;
    var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    dd = "-" + dd;
    var hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
    hh = " " + hh;
    var min = ":00";
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min);
};

// date to yyyy/mm/dd hh:mm
Date.prototype.yyyymmddhhmmSlash = function () {
    var yyyy = this.getFullYear();
    var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    mm = "-" + mm;
    var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    dd = "-" + dd;
    var hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
    hh = " " + hh;
    var min = this.getMinutes() < 10 ? "0" + this.getMinutes() : this.getMinutes();
    min = ":" + min;
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min);
};

// date to yyyy/mm/dd 
Date.prototype.yyyymmddSlash = function () {
    var yyyy = this.getFullYear();
    var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    mm = "/" + mm;
    var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    dd = "/" + dd;
    return "".concat(yyyy).concat(mm).concat(dd);
};