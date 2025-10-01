// C:\1 崇峻\給宏碁\Demo_yu_1026\Demo_Profile\js\ProfileChart.js
// 2021-10-27
// 2021-12-14 已完成! 沒有必要，請勿修改!
// 繪製Profile

'use strict';


export class ProfileChart {

    constructor(head, jsonBase, DOM) {
        this.head = head;           // 各節點計算水位
        this.jsonBase = jsonBase;   // 節點及管渠 基本資料
        this.DOM = DOM;             // ex. "#Chart_Hydrograph";
        this.ManholeWidth = +3.0;   // 人孔寬度(繪圖用)
        // 可清除之物件
        this.Chart;
        // 節點名稱 tooltip 使用
        this.ManholeNames;
        // 節點水位 tooltip 使用
        this.NodeNames;
        this.NodeCenter;
        this.tw_chart;
    }

    // * redraw
    Redraw() {
        // console.log("Redraw()", this.tw_chart);
        // console.log(this.NodeNames);
        // 標註節點名稱
        this.fillText(this.tw_chart);
    }

    // * 準備節點名稱
    PrepareNodeNames(nodeCenter) {
        this.NodeNames = [];
        this.NodeCenter = [];
        let pnodes = this.jsonBase.PNodes;
        for (let i = 0; i < nodeCenter.length; i++) {
            this.NodeNames.push(pnodes[i].ID);
            this.NodeCenter.push(nodeCenter[i]);
        }
        this.NodeCenter = nodeCenter;
        // console.log({NodeNames : this.NodeNames});
        // console.log({NodeCenter: this.NodeCenter});
    }

    // * 取得連接節點的管渠基本資料
    // input name
    // output link object
    GetLink(name) {
        let index = this.jsonBase.PLinks.indexOf(name);
        if (index == -1) return null;
        return this.jsonBase.Plinks[index];
    }

    // * 節點周圍管渠的最大高度 - 所有管渠
    CalMaxHeight(aLinks) {
        if (aLinks.length == null) return 0;
        let maxHeight = Number.MIN_VALUE;
        for (let i = 0; i < aLinks.length; i++) {
            let linkName = aLinks[i];
            let link = this.GetLink(linkName);
            if (link != null && link.Height > maxHeight)
                maxHeight = link.Height;
        }
        return maxHeight;
    }

    // * 以節點名稱找到管渠 - 這會過濾掉非路徑上的管渠，只取出在路徑上的管渠
    GetLinkByNodeName(name) {
        let a = this.jsonBase.PLinks.filter(
            x => x.FromNode === name || x.ToNode === name);
        return a;
    }

    // * 以節點名稱，決定節點頂部高程
    CalLinkTopElev_SingleNode(StartNode) {
        let link = this.GetLinkByNodeName(StartNode);
        let linkTop;

        // 取最大值
        linkTop = Number.MIN_VALUE;
        let linkTop1;

        for (let i = 0; i < link.length; i++) {
            if (StartNode === link[i].ToNode)
                linkTop1 = link[i].OutOffset + link[i].Height;
            if (StartNode === link[i].FromNode)
                linkTop1 = link[i].InOffset + link[i].Height;
            linkTop = Math.max(linkTop, linkTop1);
        }
        return linkTop;
    }

    // 計算人孔底部位置[[x0,y0],[x1,y1]]
    // output 
    //   [xy, groundxy]  
    //    xy        : 人孔底部(x,y)，x 為中心點
    //    groundxy  : 人孔頂部(x,y)

    CalNodeInvXY() {
        let plinks = this.jsonBase.PLinks;
        let pnodes = this.jsonBase.PNodes;
        let MaxHeight = this.CalMaxHeight(pnodes[0].aLink);
        let x = +0,
            y = +pnodes[0].Invert;

        // 人孔頂部地面高程 = 人孔高度與周圍管渠的最大高度，取最大值。

        let z;

        let b = [x, y];  // first point
        let xy = []; //new Array(pnodes.length);
        let groundxy = []; //new Array(pnodes.length);

        // 以節點為迴圈

        for (let i = 0; i < pnodes.length; i++) {

            // 底部高程
            y = pnodes[i].Invert;
            let StartNode = pnodes[i];
            z = StartNode.Invert + StartNode.MaxDepth;

            // 以節點名稱找到2管渠
            // 從2管渠決定人孔的高度
            let linkTopElev = this.CalLinkTopElev_SingleNode(StartNode.ID);
            z = Math.max(z, linkTopElev);

            // 距離
            if (i > 0) x += plinks[i - 1].Length;

            xy.push([x, y]);
            groundxy.push([x, z]);
        }

        // console.log({ manholeBottom: xy })
        // console.log({ manholeTop: groundxy })
        return [xy, groundxy];
    };

    // 繪製管渠頂部線、人孔中間是空心的

    PrepareLinkTopLine() {
        let w = this.ManholeWidth / 2.0;
        let plinks = this.jsonBase.PLinks;
        let pnodes = this.jsonBase.PNodes;

        let x = +0, y;
        let xy = [];

        // v2

        for (let i = 0; i < plinks.length; i++) {

            let startNode = pnodes[i].ID;
            let endNode = pnodes[i + 1].ID;

            // From
            x += w;

            // InOffset or OutOffset
            if (plinks[i].FromNode === startNode) {
                y = +plinks[i].InOffset + +plinks[i].Height;
            }
            if (plinks[i].ToNode === startNode) {
                y = +plinks[i].OutOffset + +plinks[i].Height;
            }

            xy.push([x, y]);

            // To
            x += +plinks[i].Length - w * 2.0;

            // InOffset or OutOffset
            if (plinks[i].FromNode === endNode) {
                y = +plinks[i].InOffset + +plinks[i].Height;
            }
            if (plinks[i].ToNode === endNode) {
                y = +plinks[i].OutOffset + +plinks[i].Height;
            }
            xy.push([x, y]);

            // move to left hand side of manhole
            xy.push([x, null]);
            x += w;
        }

        // console.log({ PrepareLinkTop: xy });
        return xy;
    };

    // ------------------------------------------
    // 繪製管渠底部線、人孔中間是空心的 - 沒使用!
    // ------------------------------------------
    PrepareLinkBottomLine() {
        let w = this.ManholeWidth / 2.0;
        let plinks = this.jsonBase.PLinks;
        let pnodes = this.jsonBase.PNodes;
        let x = +0, y;
        let xy = [];

        for (let i = 0; i < plinks.length; i++) {
            let startNode = pnodes[i].ID;
            let endNode = pnodes[i + 1].ID;

            // From
            x += w;

            // InOffset or OutOffset
            if (plinks[i].FromNode === startNode) {
                y = +plinks[i].InOffset;
            }
            if (plinks[i].ToNode === startNode) {
                y = +plinks[i].OutOffset;
            }

            xy.push([x, y]);

            // To
            x += +plinks[i].Length - w * 2.0;

            // InOffset or OutOffset
            if (plinks[i].FromNode === endNode) {
                y = +plinks[i].InOffset;
            }
            if (plinks[i].ToNode === endNode) {
                y = +plinks[i].OutOffset;
            }
            xy.push([x, y]);

            // move to left hand side of manhole
            xy.push([x, null]);
            x += w;
        }
        return xy;
    };

    // 繪製人孔
    // input :
    //   invert and ground elevation array

    /*  一組人孔如下
        {lineWidth: 2, xaxis: {from: 204, to: 204}, yaxis: {from: 0.35, to: 3.15}, color: "#000"}, // 202.5
        {lineWidth: 2, xaxis: {from: 201, to: 201}, yaxis: {from: 0.35, to: 3.15}, color: "#000"},
    */
    PrepareMainhole(data) {
        let marks = [];
        let w = this.ManholeWidth / 2.0;

        for (let i = 0; i < data[0].length; i++) {
            let invert = data[0][i];
            let ground = data[1][i];
            let xaxis1 = { from: +invert[0] - w, to: +ground[0] - w };
            let xaxis2 = { from: +invert[0] + w, to: +ground[0] + w };
            let yaxis = { from: +invert[1], to: +ground[1] };
            marks.push({
                "lineWidth": 2, "xaxis": xaxis1, "yaxis": yaxis, "color": "#000"
            });
            marks.push({
                "lineWidth": 2, "xaxis": xaxis2, "yaxis": yaxis, "color": "#000"
            });
        }
        return marks;
    };

    // 人孔底部封口 and 管渠底部連線
    // input
    //   data, 人孔底部距離與頂部高程
    //   data[0] : 底部距離與高程
    //   data[1] : 頂部距離與高程
    //   jsonBase : 節點與管渠基

    PrepareMainholeBottom(data) {
        let plinks = this.jsonBase.PLinks;
        let pnodes = this.jsonBase.PNodes;

        // console.log({invert : data})
        // console.log({pnodes : jsonBase.PNodes })
        let xy = [];
        let w = this.ManholeWidth / 2.0;
        let x = +0, y;
        // for tooltip
        this.ManholeNames = [];

        for (let i = 0; i < data[0].length - 1; i++) {
            let startNode = pnodes[i].ID;
            let endNode = pnodes[i + 1].ID;

            // 人口底部高程
            let invert = data[0][i];
            // 人孔右側底部
            x = invert[0] - w;
            y = +invert[1];

            xy.push([x, y]);
            this.ManholeNames.push(pnodes[i].ID);
            // 人孔左側底部
            x = invert[0] + w;
            xy.push([x, y]);

            this.ManholeNames.push(pnodes[i].ID);

            // let link = this.GetLinkByNodeName(pnodes[i].ID);
            // console.log({link : link});

            // link between two manholes
            if (i < data[0].length - 1) {
                // FromNode人孔左側管渠連接點
                x = invert[0] + w;
                // console.log({plinks_i : plinks[i]})
                // InOffset or OutOffset
                if (plinks[i].FromNode === startNode) {
                    y = +plinks[i].InOffset;
                }
                if (plinks[i].ToNode === startNode) {
                    y = +plinks[i].OutOffset;
                }
                xy.push([x, y]);

                this.ManholeNames.push(plinks[i].ID);
                // ToNode人孔左側管渠連接點
                let x1 = data[0][i + 1][0] - w;

                // InOffset or OutOffset
                if (plinks[i].FromNode === endNode) {
                    y = +plinks[i].InOffset;
                }
                if (plinks[i].ToNode === endNode) {
                    y = +plinks[i].OutOffset;
                }
                xy.push([x1, y]);
                this.ManholeNames.push(plinks[i].ID);
            }
        }

        // 最後一個節點，封底
        let n = data[0].length - 1;
        // 人口底部高程
        let invert = data[0][n];

        // 人孔左側底部
        x = invert[0] + w;
        xy.push([x, y]);

        this.ManholeNames.push(pnodes[n].ID);
        // console.log({ PrepareMainholeBottom: xy })
        return xy;
    }

    // Find Head by given id
    FindHead(id) {
        if (this.head.Results == null || this.head.Results.length == 0)
            return null;
        for (let i = 0; i < this.head.Results.length; i++) {
            if (id === this.head.Results[i].ID)
                return Number(this.head.Results[i].Head);
        }
        return null;
    }

    /* 準備水位縱剖線
       input
         data  : invert X and Y
    */
    PrepareProfileHeads(data) {
        let plinks = this.jsonBase.PLinks;
        let pnodes = this.jsonBase.PNodes;

        let xy = [];
        let w = this.ManholeWidth / 2.0;
        let x = +0, y;
        // console.log({PNodes : this.jsonBase.PNodes });

        for (let i = 0; i < data[0].length; i++) {

            // 取得節點底部高程
            let invert = data[0][i];

            // 取得節點水位
            let nodeName = this.jsonBase.PNodes[i].ID;

            // 人孔右側
            x = invert[0] - w;
            let y = this.FindHead(nodeName);
            xy.push([x, y]);

            // 人孔左側
            x = invert[0] + w;
            xy.push([x, y]);

            // 人孔處的水位為上下游節點的連線
            if (i < data[0].length - 1) {
                // 起點節點
                let startNode = pnodes[i].ID;
                // 終點節點
                let endNode = pnodes[i + 1].ID;

                // * 取得管渠起點高程
                let startLinkBottomElev;
                if (plinks[i].FromNode === startNode) {
                    startLinkBottomElev = +plinks[i].InOffset;
                }
                if (plinks[i].ToNode === startNode) {
                    startLinkBottomElev = +plinks[i].OutOffset;
                }
                // * 取得管渠終點高程
                let endLinkBottomElev;
                if (plinks[i].FromNode === endNode) {
                    endLinkBottomElev = +plinks[i].InOffset;
                }
                if (plinks[i].ToNode === endNode) {
                    endLinkBottomElev = +plinks[i].OutOffset;
                }

                // 取得下游節點水位
                let nodeName1 = this.jsonBase.PNodes[i + 1].ID;
                let y1 = this.FindHead(nodeName1);
                let x1 = data[0][i + 1][0];

                if (y < startLinkBottomElev || y1 < endLinkBottomElev) {
                    // 管渠起點
                    xy.push([x, null]);
                    // 管渠終點
                    xy.push([x1, null]);
                } else {
                    // 管渠起點
                    xy.push([x, y]);
                    // 管渠終點
                    xy.push([x1, y1]);
                }
            }
        }

        return xy;
    }

    /* 找到最高水位
       original json : 
            {"ProjectID":"TYYU_DEMO_A","InitTime":"2021-09-07 21:00","FcstTime":"2021-09-07 22:00","Results":[{"ID":"YU8","Head":107.78},{"ID":"YU7.5","Head":107.65},{"ID":"YU7.41","Head":107.12}]}
       output
         maxHead
    */
    FindMaxHead() {
        if (this.head.Results == null || this.head.Results.length == 0)
            return undefined;
        let maxHead = -9999.0;
        for (let i = 0; i < this.head.Results.length; i++) {
            maxHead = Math.max(maxHead, this.head.Results[i].Head);
        }
        return maxHead;
    };

    // 找到縱剖面所有人孔最高點
    FindMaxElev(data) {
        var highest = Number.NEGATIVE_INFINITY;
        var tmp;
        for (var i = data.length - 1; i >= 0; i--) {
            tmp = data[i][1];
            if (tmp > highest) highest = tmp;
        }
        return highest;
    }

    // 找到縱剖面所有人孔最低點
    FindMinElev(data) {
        let lowest = Number.POSITIVE_INFINITY;
        let tmp;
        for (var i = data.length - 1; i >= 0; i--) {
            tmp = data[i][1];
            if (tmp < lowest) lowest = tmp;
        }
        return lowest;
    }

    // Plot Profile Entry
    /* input
        head : heads at manhole
    */
    PlotProfile() {
        // console.log('head : ', this.head.Results);

        // 計算人孔底部位置[[x0,y0],[x1,y1]]
        let data = this.CalNodeInvXY();
        let nNodes = data[0].length;
        let maxDistance = data[0][nNodes - 1][0];
        // console.log({ maxDistance: maxDistance });

        // prepare mainhole: use markings
        let marks = this.PrepareMainhole(data);

        // manhole bottom line
        let ManholeBottom = this.PrepareMainholeBottom(data);

        // prepare head profile
        let Profile = this.PrepareProfileHeads(data);

        // 找到最高水位
        let maxHead = this.FindMaxHead();
        maxHead = maxHead || Number.NEGATIVE_INFINITY;

        // 找到最高地表高程
        let maxManholeElev = this.FindMaxElev(data[1]);
        // console.log({data1 : data[1]})
        // 找到最低地表高程
        let minManholeElev = this.FindMinElev(ManholeBottom);
        // 最高水位與地面取大值
        let maxValue1 = Math.max(maxManholeElev, maxHead);
        // 黃金比例
        maxValue1 = minManholeElev + 1.5 * (maxValue1 - minManholeElev);

        // link top line
        let LinkTopLine = this.PrepareLinkTopLine();
        // console.log('LinkTopLine : ', LinkTopLine);
        // link bottom line
        //let LinkBottomLine = Chart4.PrepareLinkBottomLine(json);
        // console.log('LinkBottomLine : ', LinkBottomLine);

        // 準備節點名稱
        this.PrepareNodeNames(data[1]);

        // dataset : 繪圖用資料，必須是array!
        let dataset = [
            {
                id: 'Head',
                label: "水位",
                color: "blue",
                data: Profile,                              // OK 
                lines: { show: true, fill: true },
                points: { show: true },
                fillBetween: 'LinkBottom',
                fillColor: "#FF0000"
            },
            {
                id: 'LinkBottom',
                label: "管渠底部",
                color: "#000",
                data: ManholeBottom,                        // OK
                lines: { show: true, fill: false },
                //points: { show: true }
            }, {
                id: 'NodeTop',
                label: "人孔頂部高程",
                color: "brown",
                data: data[1],                              // OK
                lines: { show: true, fill: true },
                fillBetween: 'LinkTop'
                //points: { show: true }
            }, {
                id: 'LinkTop',
                label: "管渠頂部",
                color: "#000",
                data: LinkTopLine,                          // OK
                lines: { show: true }
                //points: { show: true }
            }, {
                id: 'NodeName',
                label: "節點名稱",
                color: "brown",
                data: this.NodeCenter,                      // OK
                lines: { show: false, fill: false },
                points: { show: true }
            }
        ];

        // lineOption : 繪圖選項
        let lineOption = {
            series: {},
            xaxis: {
                transform: function (v) { return -v; }, // run it backwards
                inverseTransform: function (v) { return -v; },
                min: -this.ManholeWidth - 20,
                max: maxDistance + 20,
                axisLabel: "距離(m)"
            },
            yaxis:
            {
                position: "left",
                min: minManholeElev,
                max: maxValue1,
                axisLabelFontSizePixels: 12,
                axisLabel: "高程(m)"
            },
            grid: {
                hoverable: true,
                markings: marks
            },
            legend: {
                //圖例邊框顏色
                noColumns: 5,
                margin: [0, -20],// [x margin, y margin]
                backgroundColor: null, //null or color
                backgroundOpacity: 0.1, //number between 0 and 1
                position: "nw",// or "nw" or "se" or "sw"  or "ne"
                show: true
            },
            tooltip: false,
            tooltipOpts: {
                content: "(%x.2, %y.2)"
            }

        };

        this.tw_chart = $.plot(this.DOM, dataset, lineOption);
        $(this.DOM).UseTooltip(this.ManholeNames);
        // 標註節點名稱
        this.fillText(this.tw_chart);

        return;
    } // end of drawHistograph()

    // * 標註節點名稱

    fillText(somePlot) {
        // after initial plot draw, then loop the data, add the labels
        // I'm drawing these directly on the canvas, NO HTML DIVS!
        // code is un-necessarily verbose for demonstration purposes
        if (somePlot) {
            let index = 4;
            var ctx = somePlot.getCanvas().getContext("2d"); // get the context
            var data = somePlot.getData()[index].data;  // get your series data
            var xaxis = somePlot.getXAxes()[0]; // xAxis
            var yaxis = somePlot.getYAxes()[0]; // yAxis
            var offset = somePlot.getPlotOffset(); // plots offset
            ctx.font = "10px 'Segoe UI'"; // set a pretty label font
            ctx.fillStyle = "black";
            // console.log({ data: data })
            for (var i = 0; i < data.length; i += 1) {
                let text = this.NodeNames[i];
                let metrics = ctx.measureText(text);
                // var xPos = (xaxis.p2c(data[i][0]) + offset.left) - metrics.width / 2; // place it in the middle of the bar : -metrics.width / 2
                let xPos = (xaxis.p2c(data[i][0]) + offset.left); // place it in the middle of the bar : -metrics.width / 2
                let yPos = yaxis.p2c(data[i][1]) + offset.top - 5; // place at top of bar, slightly up
                ctx.beginPath();
                ctx.save();
                ctx.translate(xPos, yPos);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(text, 0, 0);
                ctx.restore();
                ctx.closePath();
            }
        }
    }

    // 縱剖面基本資料表
    // input:
    //   profile json data
    /*{
            "ID": "C_000246",
            "Type": "CONDUIT",
            "Marked": false,
            "FromNode": "J_000250",
            "ToNode": "J_000254",
            "Length": 121.3,
            "InOffset": 0.76,
            "OutOffset": 0.35
        }
    */

    GenProfileTable() {
        let tr = "", td = "";
        let n = this.jsonBase.PLinks.length;

        for (let i = 0; i < n; i++) {
            let id = this.jsonBase.PLinks[i].ID;
            let type = this.jsonBase.PLinks[i].Type;
            let FromNode = this.jsonBase.PLinks[i].FromNode;
            let ToNode = this.jsonBase.PLinks[i].ToNode;
            let Length = this.jsonBase.PLinks[i].Length;
            let height = this.jsonBase.PLinks[i].Height;
            let InOffset = this.jsonBase.PLinks[i].InOffset;
            let OutOffset = this.jsonBase.PLinks[i].OutOffset;

            td = "<td>" + (i + 1) + "</td>";
            td += "<td>" + id + "</td>";
            td += "<td>" + type + "</td>";
            td += "<td>" + FromNode + "</td>";
            td += "<td>" + ToNode + "</td>";
            td += "<td>" + Length.toFixed(2) + "</td>";
            td += "<td>" + height.toFixed(2) + "</td>";
            td += "<td>" + InOffset.toFixed(2) + "</td>";
            td += "<td>" + OutOffset.toFixed(2) + "</td>";
            tr += `<tr class='text-black'>${td}</tr>`;
        }
        return tr;
    };

    // generate Profile table title
    static GenProfileTableTitle() {
        let tr = "", td = "";
        td = "<td>序號</td>";
        td += "<td>管渠</td>";
        td += "<td>管渠型式</td>";
        td += "<td>起點</td>";
        td += "<td>終點</td>";
        td += "<td>長度(m)</td>";
        td += "<td>管渠高度(m)</td>";
        td += "<td>起點高程(m)</td>";
        td += "<td>終點高程(m)</td>";
        tr += `<tr class='text-black text-bold'>${td}</tr>`;
        return tr;
    };

    // ------------------------------------------------------
    // 節點水位的顏色
    // input : 人孔頂部高程、水位
    // output : 顏色CLASS
    // ------------------------------------------------------
    static HeadColor(nodeTop, head) {
        if (nodeTop > head)
            return "badge bg-success";
        else
            return "badge bg-danger";
    };


    // ------------------------------------------------------
    // generate profile table
    // input:
    //   profile json data
    //   array: ProfileHeads.Results
    /*"PNodes": [{
            "ID": "J_000250",
            "type": "JUNCTION",
            "aLink": ["C_000246", "C_000251"],
            "PathLength": 0,
            "Invert": 0.76,
            "MaxDepth": 2.8
        },
       -----------------------------------------------------
    */
    GenProfileTable_Nodes() {
        let tr = "", td = "";
        // console.log({ headResults: this.head.Results })
        // 如果this.head.Results == undefined, 就不管水位了，產生節點基本資料就可。

        if (this.head.Results !== undefined) {
            if (this.head.Results == null || this.head.Results.length == 0) {
                td = `<td>-</td>`;
                td += `<td>-</td>`;
                td += `<td>-</td>`;
                td += `<td>-</td>`;
                td += `<td>-</td>`;
                td += `<td>-</td>`;
                tr += `<tr>${tr}</tr>`;
                return tr;
            }
        }

        let n = this.jsonBase.PNodes.length;
        let c = "badge bg-success"; // bg-success, bg-warning, bg-danger

        // console.log('in GenProfileTable_Nodes(), head of nodes : ', this.json.Results);

        for (let i = 0; i < n; i++) {
            let id = this.jsonBase.PNodes[i].ID;
            let type = this.jsonBase.PNodes[i].type;
            let invert = this.jsonBase.PNodes[i].Invert;
            let maxDepth = this.jsonBase.PNodes[i].MaxDepth;

            //console.log('i :', i, ' PNodes[i].ID : ', id, ' array[i].ID:', array[i].ID);
            let head;
            if (this.head.Results !== undefined)
                head = this.head.Results[i].Head;
            else head = 0;

            let nodeTop = invert + maxDepth;

            c = ProfileChart.HeadColor(nodeTop, head);

            td = `<td>${(i + 1)}</td>`;
            td += `<td>${id}</td>`;
            td += `<td>${type}</td>`;
            td += `<td>${invert.toFixed(2)}</td>`;
            td += `<td>${maxDepth.toFixed(2)}</td>`;
            td += `<td><span class='${c} text-light'>${head.toFixed(2)}</span></td>`;
            tr += `<tr>${td}</tr>`;
        }
        return tr;
    };

    // generate Profile table title
    static GenProfileTable_Nodes_Title() {
        let tr = "", td = "";
        td = "<td>序號</td>";
        td += "<td>節點</td>";
        td += "<td>節點型式</td>";
        td += "<td>人孔底部高程(m)</td>";
        td += "<td>人孔深度(m)</td>";
        td += "<td>水位(m)</td>";
        tr += `<tr class='text-black text-bold'>${td}</tr>`;
        return tr;
    };

    // ----------------------------------------------
    // generate fcsttime select options
    // input inittime, array
    // output options
    // ----------------------------------------------
    static GenFcstSelect(inittime, array) {
        // console.log({array : array})
        if (array === null || array.length === 0)
            return "<option>NoData</option>";
        let options = "";
        // console.log('GenFcstSelect() : array = ', array);
        let obstime = new Date(inittime);
        let tau;

        for (let i = 0; i < array.length; i++) {
            let time = new Date(array[i]);
            tau = Math.round((time - obstime) / (1000 * 60));  // 1 minutes

            if (array[i] === inittime) {
                options += `<option selected value='${tau}'>${array[i]}(產製)</option>`;
            }
            else {
                if (tau < +0)
                    options += `<option value='${tau}'>${array[i]}(觀測)</option>`;
                else
                    options += `<option value='${tau}'>${array[i]}(預報)</option>`;
            }
        }
        // console.log('options : ', options);
        return options;
    };

    // ----------------------------------------
    // GetNodesCSV : 產生節點名稱csv字串
    // input LinkNodeBase.PNodes
    // output csv string
    // ----------------------------------------
    static GetNodesCSV(jsonBase) {
        let csv = "";
        if (jsonBase.PNodes === null || jsonBase.PNodes.length === 0) return null;
        for (let i = 0; i < jsonBase.PNodes.length; i++) {
            csv += jsonBase.PNodes[i].ID.toUpperCase();
            if (i < jsonBase.PNodes.length - 1)
                csv += ",";
        }
        return csv;
    };


    // -------------------------------------------------------------------------------
    // Plot Profile Main Entry
    // -------------------------------------------------------------------------------
    // json from api : 
    // {
    //  "ProjectID":"TYYU_DEMO_A",
    //  "InitTime":"2021-09-07 21:00",
    //  "FcstTime":"2021-09-07 22:00",
    //  "Results":[{"ID":"YU8","Head":107.78},{"ID":"YU7.5","Head":107.65},{"ID":"YU7.41","Head":107.12}]
    //  }

    PlotProfileMain() {

        let initTimeStr = `_${this.head.InitTime}`;
        // let initTimeClass = document.getElementsByClassName('InitTime');
        // console.log(initTimeClass);
        // for (let i = 0; i < initTimeClass.length; i++) {
        //     initTimeClass[i].innerText = initTimeStr;
        // }

        this.PlotProfile();
    }

    Clear() {
        this.Chart = null;
    }


}  // end of class ProfileChart


// tool tip for flot chart

jQuery.fn.UseTooltip = function (ManholeNames) {
    var previousPoint = null;

    jQuery(this).bind("plothover", function (event, pos, item) {
        if (item) {

            if (previousPoint !== item.dataIndex) {
                // console.log({item : item.series.label})
                previousPoint = item.dataIndex;
                jQuery("#tooltip").remove();
                let x = item.datapoint[0].toFixed(2);
                let y = item.datapoint[1].toFixed(2);
                let name = ManholeNames[item.dataIndex];
                let html = `${item.series.label}<br>
                            X:${x}<br>Y:${y}(m)`;
                showTooltip(item.pageX, item.pageY, html);
            }
        }
        else {
            jQuery("#tooltip").remove();
            previousPoint = null;
        }
    });
}

function showTooltip(x, y, contents) {
    jQuery(`<div id="tooltip">${contents}</div>`).css({
        position: 'absolute',
        display: 'none',
        top: y,
        left: x,
        border: '1px solid #4572A7',
        padding: '2px',
        fontSize: '12px',
        'background-color': '#fff',
        'z-index': 411,
        opacity: 0.80
    }).appendTo("body").fadeIn(200);
}


