// GetPathData.js
// 2025-08-26
// 縱剖面資料，儲存後台傳來的資料


// SWMM雨水下水道管網，路徑資料json。
// import { shaputh_path } from "./PathData/shaputh_path.js";

var profile_data;

export function StoreProfileData(profile){
    profile_data = profile;
}

export function GetProfileData(){
    return profile_data;
}