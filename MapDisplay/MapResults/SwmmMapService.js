// SwmmMapService.js
// 2023-09-04

// 集水區
import { DrawSubcatchments } from "../DrawSwmm/DrawSubcatchments.js";
// 子集水區重心及出口節點連接線
import { DrawCentroids } from "../DrawSwmm/DrawCentroids.js";

// 管渠
import { DrawLinks } from "../DrawSwmm/DrawLinks.js";

// 節點
import { DrawOutfalls } from '../DrawSwmm/DrawOutfalls.js';
import { DrawDividers } from "../DrawSwmm/DrawDividers.js";
import { DrawStorage } from "../DrawSwmm/DrawStorage.js";
import { DrawJunctions } from "../DrawSwmm/DrawJunctions.js";

import { MapFcstRes } from "./ReadMapRes.js"

// 滯洪池圖表
import { StorageCurve } from "../Tablejs/StorageCurve.js";

import { myAlert, GREENCOLOR } from "../myAlert.js";

// 工具程式
import { FindCenterOfMap, FindMaxLatLng, FindMinLatLng } from "../Map2D.js";

import { Base } from "../GetBaseData.js";


// 流域邊界Polygon
import { ReadAreaBorder, AreaBorder } from "../DrawBorder/ReadAreaBorder.js";
import { DrawBorder } from "../DrawBorder/DrawBorder.js";
import { SwmmCard } from "../Tablejs/SwmmCard.js";

// 滯洪池繪圖做表物件
export let storageCurve;
// 管段leaflet
export let drawConduits, drawWeirs, drawOrifices, drawPumps;

/** 子集水區的leaflet多邊形 */
export let drawSubcatchments;
// 子集水區重心及出口節點連接線
export let drawCentroids;

/** 節點leaflet */
export let drawJunctions, drawOutfalls, drawStorage, drawDividers;

/** 是否繪製子集水區 */
export let IsDrawSubBasin = true;

/** 東門溪流域邊界 */
export var drawDMBorder;

// 地圖中心座標
let MapCenter = { lat: 22.5, lng: 121.5 };


// 是否繪製箭頭
export let IsDrawArrow = false;
// 是否顯示箭頭
export let IsShowArrowHead = false;

// 準備地圖
export var SwmmMap = null;


/**add Scale control
 * @param {any} map
 */
function addScaleControl(map) {

    // Creating a Layer object
    // var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    // map.addLayer(layer); // Adding layer to the map

    var scale = L.control.scale({ metric: true }); // Creating scale control
    scale.addTo(map); // Adding scale control to the map
}


function init() {

    SwmmMap = L.map('map', {
        center: MapCenter,
        preferCanvas: true,    // 使用canvas繪製箭頭
        renderer: L.canvas(),  // canvas 速度較快
        zoom: 15
    });

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicjYwMDAxMCIsImEiOiJjaWhrM3Ftc2MwbnY1dGNsejNnNXRibWZnIn0.Vmz_EBEOASxiJJj2x-qn8A', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        minZoom: 5,
        maxZoom: 23,
        tileSize: 512,
        zoomOffset: -1,
        zoomControl: true,
        draggable: false,
        scrollWheelZoom: false
    }).addTo(SwmmMap);

    //SwmmMap.dragging.disable();
    addScaleControl(SwmmMap);
    // 測量距離
    L.Measure = {
        linearMeasurement: "Distance measurement",
        areaMeasurement: "Area measurement",
        start: "開始",
        meter: "m",
        kilometer: "km",
        squareMeter: "m²",
        squareKilometers: "km²",

    };

    var measure = L.control.measure({ position: "topleft" }).addTo(SwmmMap);

}


/**
 * 繪製Swmm空間資料，節點、管段、子集水區等
 * @param {{ COORDINATES: any;
*           POLYGONS: any[];
*           SUBCATCHMENTS: any[];
*           SUBAREAS: any; 
*           CONDUITS: any[]; 
*           VERTICES: any; 
*           XSECTIONS: any; 
*           TRANSECTS: any; 
*           CURVES: any; 
*           WEIRS: any[]; 
*           ORIFICES: any[]; 
*           PUMPS: any[]; 
*           JUNCTIONS: any[]; 
*           OUTFALLS: any[]; 
*           STORAGE: any[]; 
*           DIVIDERS: any; 
* }} json
* @param {bool} IsFitBound 是否顯示全圖
* @param {bool} IsShowArrowHead 是否顯示箭頭
*/
export function StartDrawSwmm(json, IsFitBound = false, IsShowArrowHead = true) {

    // 預設為true
    // IsFitBound = IsFitBound || true;

    MapCenter = FindCenterOfMap(json.COORDINATES);

    if (SwmmMap === null) {
        init();
        SwmmMap.panTo(MapCenter);
    }
    // else SwmmMap.panTo(MapCenter);

    // 繪製子集水區多邊形
    // [POLYGONS]
    drawSubcatchments = new DrawSubcatchments(
        SwmmMap,
        json.COORDINATES,
        json.POLYGONS,
        json.SUBCATCHMENTS,
        json.SUBAREAS
    );
    // 繪製子集水區重心出口節點虛線
    // [POLYGONS]
    drawCentroids = new DrawCentroids(
        SwmmMap,
        json.COORDINATES,
        json.POLYGONS,
        json.SUBCATCHMENTS,
        json.SUBAREAS
    );
    drawCentroids.Draw();

    //if (drawDMBorder !== undefined) drawDMBorder.Clear();
    // 是否繪製子集水區
    if (IsDrawSubBasin) {
        drawSubcatchments.Draw();
        //drawCentroids.Draw();
        // 繪製集水區邊界
        //drawDMBorder = new DrawBorder(SwmmMap, AreaBorder.dmCreek);
        //drawDMBorder.Draw();
    }


    // -----------------
    // 加入所有管渠到畫布
    // -----------------

    // [CONDUTS]
    drawConduits = new DrawLinks(
        SwmmMap,
        json.COORDINATES,
        json.CONDUITS,
        json.VERTICES,
        json.XSECTIONS,
        json.TRANSECTS,
        json.CURVES,
        "CONDUITS",
        MapFcstRes
    );
    drawConduits.Draw();

    // [註冊]重新畫管段 若zoom > 16 則繪製箭頭
    SwmmMap.on('zoomend', function (e) {
        console.log(e.target._zoom);
        if (e.target._zoom > 16) {
            // 加上箭頭 - 直接加入Layer
            SwmmMap.addLayer(drawConduits.VelArrows);
        } else {
            // 移除箭頭 - 直接移除Layer
            SwmmMap.removeLayer(drawConduits.VelArrows);
        }
    });

    // [WEIRS]
    drawWeirs = new DrawLinks(
        SwmmMap,
        json.COORDINATES,
        json.WEIRS,
        json.VERTICES,
        json.XSECTIONS,
        json.TRANSECTS,
        json.CURVES,
        "WEIRS",
        MapFcstRes,
        IsShowArrowHead
    );
    drawWeirs.Draw();

    // [ORIFICES]
    drawOrifices = new DrawLinks(
        SwmmMap,
        json.COORDINATES,
        json.ORIFICES,
        json.VERTICES,
        json.XSECTIONS,
        json.TRANSECTS,
        json.CURVES,
        "ORIFICES",
        MapFcstRes
    );
    drawOrifices.Draw();

    // [PUMPS]
    drawPumps = new DrawLinks(
        SwmmMap,
        json.COORDINATES,
        json.PUMPS,
        json.VERTICES,
        json.XSECTIONS,
        json.TRANSECTS,
        json.CURVES,
        "PUMPS",
        MapFcstRes
    );
    drawPumps.Draw();

    // -----------------
    // 加入所有節點到畫布
    // -----------------
    // [JUNCTIONS]
    drawJunctions = new DrawJunctions(
        SwmmMap,
        json.COORDINATES,
        json.JUNCTIONS,
        MapFcstRes
    );
    drawJunctions.Draw();

    // [OUTFALLS]
    drawOutfalls = new DrawOutfalls(
        SwmmMap,
        json.COORDINATES,
        json.OUTFALLS,
        json.CURVES
    );
    drawOutfalls.Draw();

    // [STORAGE]
    drawStorage = new DrawStorage(
        SwmmMap,
        json.COORDINATES,
        json.STORAGE,
        json.CURVES
    )
    drawStorage.Draw();

    // [DIVIDERS]
    drawDividers = new DrawDividers(
        SwmmMap,
        json.COORDINATES,
        json.DIVIDERS,
        json.CURVES,
        12
    )
    drawDividers.Draw();

    // 滯洪池表格
    storageCurve = new StorageCurve(json.STORAGE, json.CURVES);
    // storageCurve.GenMainTable("Storages-Table");


    // 找到最外圍邊界
    let UpRightCorner = FindMaxLatLng(json.COORDINATES);
    let LeftDownCorner = FindMinLatLng(json.COORDINATES);
    if (json.POLYGONS.length > 0) {
        UpRightCorner = FindMaxLatLng(json.POLYGONS);
        LeftDownCorner = FindMinLatLng(json.POLYGONS);
    }

    // 縮放地圖，以適合所有集水區
    if (IsFitBound) {
        console.warn("*Fit to Boundary")
        SwmmMap.fitBounds([
            [LeftDownCorner.lat, LeftDownCorner.lng],
            [UpRightCorner.lat, UpRightCorner.lng]]);
    }

    // 計算子集水區數
    let Numbers = {};
    Numbers.NSubcatchments = json.SUBCATCHMENTS.length;
    // 集水區面積
    Numbers.TotalArea = drawSubcatchments.GetTotalArea();

    // 計算管渠數
    Numbers.NConduites = json.CONDUITS.length;
    Numbers.NWeirs = json.WEIRS.length;
    Numbers.NOrifices = json.ORIFICES.length;
    Numbers.NPumps = json.PUMPS.length;
    Numbers.TotalLength = drawConduits.GetTotalLength();

    // 計算節點數
    Numbers.NJunctions = json.JUNCTIONS.length;
    Numbers.NOutfalls = json.OUTFALLS.length;
    Numbers.NStorage = json.STORAGE.length;

    // -----
    // 列表 使用lit-html
    console.log("製作SwmmCard")
    let SwmmCardContainer_el = document.getElementById("swmm-card-container");
    let swmmCard = new SwmmCard(SwmmCardContainer_el);
    swmmCard.Render(Numbers);
    // -----
}

/**
 * 繪製子集水區邊界
 * @returns
 */
export function DrawSubcatchmentBoundary() {
    IsDrawSubBasin = true;

    // 繪製子集水區
    drawSubcatchments.Draw();

    let projectId_el = document.getElementById("project-select");
    let projectId = projectId_el.value;
    console.log("draw-subcatchments:", projectId);
    if (drawDMBorder === undefined) return;
    // 若為東門溪流域 繪製邊界Polygon
    if (projectId === "TY_DMCREEK")
        drawDMBorder.Draw();
}
/**
 * 繪製過濾後的子集水區邊界
 * @returns
 */
export function DrawFilteredSubcatchmentBoundary(sub_names) {
    if (sub_names === undefined || sub_names.length === 0) {
        console.error("缺少過濾後的集水區名稱串列!")
        return;
    }
    drawSubcatchments.Clear();

    IsDrawSubBasin = true;

    // 繪製子集水區
    drawSubcatchments.DrawFilteredBasins(sub_names);

    let projectId_el = document.getElementById("project-select");
    let projectId = projectId_el.value;
    console.log("draw-subcatchments:", projectId);
    if (drawDMBorder === undefined) return;
    // 若為東門溪流域 繪製邊界Polygon
    if (projectId === "TY_DMCREEK")
        drawDMBorder.Draw();
}
/**
 * 繪製節點圓形
 * @param {number?} node_radius, 預設為10
 */
export function RedrawNodeCircles(node_radius = 10) {
    if (node_radius > +0.5) {
        myAlert(`Redraw Junctions, 半徑 :${node_radius}`, GREENCOLOR);
        drawJunctions.Clear();
        // [JUNCTIONS]
        drawJunctions = new DrawJunctions(
            SwmmMap,
            Base.data.COORDINATES,
            Base.data.JUNCTIONS,
            MapFcstRes,
            node_radius
        );
        drawJunctions.Draw();

        // [STORAGE]
        drawStorage.Clear();
        drawStorage = new DrawStorage(
            SwmmMap,
            Base.data.COORDINATES,
            Base.data.STORAGE,
            Base.data.CURVES,
            node_radius
        )
        drawStorage.Draw();

    } else {
        node_radius = +10;
        drawJunctions.Clear();
        drawJunctions = new DrawJunctions(
            SwmmMap,
            Base.data.COORDINATES,
            Base.data.JUNCTIONS,
            MapFcstRes,
            node_radius
        );
        drawJunctions.Draw();

        drawStorage.Clear();
        drawStorage = new DrawStorage(
            SwmmMap,
            Base.data.COORDINATES,
            Base.data.STORAGE,
            Base.data.CURVES,
            node_radius
        )
        drawStorage.Draw();
    }
}

/**
 * 清除子集水區邊界
 * @returns
 */
export function ClearSubcatchments() {
    IsDrawSubBasin = false;
    // 清除子集水區
    drawSubcatchments.Clear();
    if (drawDMBorder === undefined) return;
    drawDMBorder.Clear();
}
/** 清除所有節點物件*/
export function ClearAllNodes() {
    if (drawJunctions !== undefined) drawJunctions.Clear();
    if (drawOutfalls !== undefined) drawOutfalls.Clear();
    if (drawStorage !== undefined) drawStorage.Clear();
    if (drawStorage !== undefined) drawDividers.Clear();
}

/** 清除所有管段物件 */
export function ClearAllLinks() {
    if (drawConduits !== undefined) drawConduits.Clear();
    if (drawWeirs !== undefined) drawWeirs.Clear();
    if (drawOrifices !== undefined) drawOrifices.Clear();
    if (drawPumps !== undefined) drawPumps.Clear();
}
