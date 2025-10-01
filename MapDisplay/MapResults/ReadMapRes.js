// ReadMapRes.js
// 2023-09-04
// 讀取東門溪所有節點SWMM預報結果
import { BaseUrl_MIT } from '../../Common/BaseURL.js';
import { myAlert } from '../myAlert.js';
import { StartDrawSwmm, drawSubcatchments, ClearAllNodes, ClearAllLinks, } from './SwmmMapService.js';
import { ClearAllPaths } from '../DrawSwmm/DrawPath.js';

// SWMM預報結果
export let MapFcstRes;

/**
 * 找到指定節點的SWMM預報結果
 * @param {string} NodeName 
 * @returns { {Id, Head, Flow, Flood} | null }
 */
export function FindNodeValue(NodeName) {
    if (IsMapFcstResUndefined) return null;
    let node_value = MapFcstRes.Nodes.filter(x => x.Id === NodeName);
    if (node_value.length > 0) {
        let { Id, Head, Flow, Flood } = node_value[0];
        // console.log(`FindNodeValue(), NodeName:${NodeName}, Id:${Id},Head:${Head},Flow:${Flow},Flood:${Flood}`);
        return { Id, Head, Flow, Flood };
    }
    return null;
}

/** 檢查預報結果是否為undefined */
export function IsMapFcstResUndefined() {
    //console.log(MapFcstRes);
    return (MapFcstRes === undefined)
}

/**
 * 找到指定節點的SWMM預報結果
 * @param {*} LinkName 
 * @returns 
 */
export function FindLinkValue(LinkName) {
    if (MapFcstRes === undefined) return null;
    if (MapFcstRes === null) return null;
    try {
        let link_value = MapFcstRes.Links.filter(x => x.Id === LinkName);
        if (link_value.length > 0) {
            let { Id, Depth, Velocity, Flow, Capacity } = link_value[0];
            return { Id, Depth, Velocity, Flow, Capacity };
        }
    } catch (e) {
        //console.warn("[ERROR]FindLinkValue(),沒有資料!")
    }
    return null;
}


/* SWMM 預報結果API資料型態
export interface Root {
  ProjectId: string
  InitTime: string
  FcstTime: string
  Nodes: Node[]
  Links: Link[]
  SubCatch: SubCatch[]
  Message: string
}

export interface Node {
  Id: string
  Head: number
  Flow: number
  Flood: number
}

export interface Link {
  Id: string
  Depth: number
  Velocity: number
  Flow: number
  Capacity: number
}

export interface SubCatch {
  Id: string
  Precip: number
  Infil: number
  Runoff: number
}

*/