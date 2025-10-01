// APBTable.js
// 2024-11-08
// 計算不規則斷面的通水面積、水面寬度及濕周長

// ABP表水位切分數
const MAXTABLE = 30;

export class ABPTable {
    // 渠道斷面最高點高程(M)
    SectLowest = {};
    // 渠道斷面最低點高程(M)
    SectHighest = {};
    /**
     *
     * @param {{Name: string,nLob: number,nRob: number,nCh: number,Npts: number,
     *         xLeft: number,xRight: number,X: number[],Y: number[]}[]} transects
     */
    constructor(transects) {
        this.transects = transects;
        //-----Local

        // 不規則斷面的APB表
        /**
         * id vs WEL,A,B,P dict
         */
        this.ABP = {};
    }
    /**取出指定斷面的不規則斷面ABP字典 */
    GetAPBTableById(id) {
        if (this.ABP.hasOwnProperty(id))
            return ABP[id];
        else
            return null;
    }
    /**
     * Find the transect
     * @param {string} name
     */
    findSectXY(name) {
        let array = this.transects.filter(x => x.Name.toUpperCase() === name);
        if (array != null && array.length > 0)
            return { X: array[0].X, Y: array[0].Y };
        return { X: null, Y: null };
    }
    /**
     * 斷面Y值串列
     * @param {number[]} Y
     * @returns
     */
    static Find_Lowest(Y) {
        let LowestEL = Number.MAX_VALUE; // double.MaxValue;
        let index = -1;

        for (let i = 0; i < Y.length; i++) {
            if (Y[i] < LowestEL) {
                LowestEL = Y[i];
                index = i;
            }
        }
        return { index, LowestEL };
    }
    /**
     * 斷面Y值串列
     * @param {number[]} Y
     * @returns
     */
    static Find_high(Y) {
        let maxY = Number.MIN_VALUE; // double.MinValue;
        let index = -1;

        for (let i = 0; i < Y.length; i++)
            if (maxY < Y[i]) {
                maxY = Y[i];
                index = i;
            }

        return { index, maxY };
    }

    /**
     * 計算不規則斷面的通水面積、水面寬度、濕周長
     * @param {number[]} X 水平距離(M)
     * @param {number[]} Y 高程(M)
     * @param {number} WEL 水位(M)
     * @returns flow area, top width, perimeter
     */
    static CalABP(X, Y, WEL) {
        if (X === undefined || Y === undefined) {
            console.warn("CalABP(), X, Y 未定義!");
            return { WEL: WEL, a: null, b: null, p: null };
        }
        if (X.length === 0 || Y.length === 0) {
            console.warn("CalABP(), X, Y 不可為空字串!");
            return { WEL: WEL, a: null, b: null, p: null };
        }

        let i;
        let DY1, DY2, DX, DX1, XP, DY, SLOPE;
        let a = 0;
        let p = 0;
        let b = 0;

        for (i = 0; i < X.length - 1; i++) {
            DY1 = +WEL - +Y[i];
            DY2 = +WEL - +Y[i + 1];
            DX = +X[i + 1] - +X[i];
            DY = +Y[i + 1] - +[i];

            if (DY1 >= 0 && DY2 >= 0) {
                a += 0.5 * (DY1 + DY2) * DX;
                p += Math.sqrt(DX * DX + DY * DY);
                b += DX;
            }

            // - 若水位與測點連線有交點，則找出交點座標
            if (DY1 * DY2 < 0) {
                SLOPE = (X[i + 1] - X[i]) / (Y[i + 1] - Y[i]);
                DX1 = (Y[i + 1] - +WEL) * SLOPE;
                XP = X[i + 1] - DX1;

                // - CASE : DY1 > 0
                if (DY1 > 0) {
                    a += 0.5 * DY1 * (XP - X[i]);
                    p += Math.sqrt((XP - X[i]) * (XP - X[i])
                        + (+WEL - Y[i]) * (+WEL - Y[i]));
                    b += XP - X[i];
                }

                // - CASE : DY2 > 0
                if (DY2 > 0) {
                    a += 0.5 * DY2 * (X[i + 1] - XP);
                    p += Math.sqrt((X[i + 1] - XP) * (X[i + 1] - XP)
                        + (+WEL - Y[i + 1]) * (+WEL - Y[i + 1]));
                    b += X[i + 1] - XP;
                }
            }
        }
        return { WEL: WEL, a: a, b: b, p: p };
    }
    /**
     * 計算單一斷面的ABP表
     * @param {string} id 
     */
    GenSingleABPTable(id, IsDetail = false) {
        let XY = this.findSectXY(id);
        if (XY === null) {
            console.warn(`GenSingleABPTable(), 找不到斷面=${id}`);
            return null;
        }
        let Lowest = ABPTable.Find_Lowest(id);
        this.SectLowest[id] = Lowest.LowestEL;
        let Highest = ABPTable.Find_high(id);
        this.SectHighest[id] = Highest.maxY;

        let WEL = Lowest.LowestEL;
        let dy = (Highest.maxY - Lowest.LowestEL) / +MAXTABLE;
        if (IsDetail) {
            console.log(`渠道最低點高程:${Lowest.LowestEL}`);
            console.log(`渠道最高點高程:id=${id},${Highest.maxY}, index:${Highest.index}`);
            console.log(`dy=${dy}`);
        }
        let abp = [];
        while (WEL < Highest.maxY) {
            // 計算全斷面水力特性
            let record = ABPTable.CalABP(XY.X, XY.Y, id, WEL);
            // console.log({record})
            abp.push(record);
            WEL += dy;
        }

        // 補充最後一個
        let LastStage = abp[abp.length - 1].WEL;
        if (LastStage < Highest.maxY) {

            WEL = Highest.maxY;
            let record = ABPTable.CalABP(XY.X, XY.Y, id, WEL);
            if (IsDetail) {
                console.log("補充最後一個");
                console.log(`${WEL} -> A:${record.a},P:${record.p},B:${record.b}`);
            }
            abp.push(record);
        }
        return abp;
    }
    /**生成所有斷面的ABP表 */
    GenAPBTable() {
        let sect_names = this.transects.map(x => x.Name);
        if (sect_names.length === 0) {
            console.warn(`[ERROR]缺少不規則斷面資料!請先讀取資料後再試一次`);
            return -1;
        }
        sect_names.forEach(id => {
            let abp = this.GenSingleABPTable(id, false);
            this.ABP[id] = abp;
        });
        return 0;
    }
}
