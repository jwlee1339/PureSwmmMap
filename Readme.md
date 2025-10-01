# PureSwmmMap 專案

`PureSwmmMap` 是一個用於視覺化和分析 SWMM (Storm Water Management Model) 管網資料的應用程式。本專案可以讀取經過處理過的 SWMM 的 `.json` 檔案(由另外的程式產生)，並在地圖上展示管網的各種元件。

第一個核心功能是路徑搜尋，能夠在複雜的無方向性管網中，找出兩個指定節點之間的所有可能排水路徑，並繪製縱剖面圖。第二個核心功能是，找到匯流到指定節點的所有子集水區。

## 主要功能

- **SWMM 資料視覺化**：
  - 在地圖介面上呈現 SWMM 模型中的人孔、匯流點、排放口等節點，以及連接它們的管渠。
- **路徑搜尋與分析**：
  - 需要後端支援，建議使用firefox瀏覽器，並開啟Cors Enable
  - 使用深度優先搜尋（DFS、BFS）演算法，
  - 從指定的 `StartNode` 到 `EndNode` 搜尋最少節點的路徑，以及起點到出水口之間的所有可能的路徑。
  - 支援無方向性的管網搜尋，能夠處理雙向流動或逆流的可能性。
  - 提供路徑上所有節點與管渠的詳細屬性資料。
  - 繪製排水路徑縱剖面圖，需要後端支援，建議使用firefox瀏覽器，並開啟Cors Enable。
- **子集水區搜尋**：
  - 透過指定節點名稱，可搜尋匯流至該節點的所有子集水區名稱及面積。
- **資料匯出**：
  - 將搜尋到的路徑結果以 JSON 格式匯出，方便後續分析或與其他系統整合。

## TY_DMCREEK.json資料結構說明

`TY_DMCREEK.json` 檔案儲存了從 SWMM `.inp` 檔案中解析出來的完整管網模型資料，包括了所有元件的地理座標和屬性。這份資料是地圖視覺化的基礎。

### 頂層結構

```json
{
  "ProjectId": "專案ID",
  "InpFile": "來源的 .inp 檔案路徑",
  "DIMENSIONS": { "模型邊界範圍" },
  "COORDINATES": [ { "所有節點的座標" } ],
  "VERTICES": [ { "管渠折點的座標" } ],
  "POLYGONS": [ { "集水分區的邊界座標" } ],
  "JUNCTIONS": [ { "匯流點屬性" } ],
  "STORAGE": [ { "儲存設施屬性" } ],
  "OUTFALLS": [ { "排放口屬性" } ],
  "CONDUITS": [ { "管渠屬性" } ],
  "XSECTIONS": [ { "管渠斷面屬性" } ],
  "SUBCATCHMENTS": [ { "集水分區屬性" } ],
  "...": "其他 SWMM 元件如 PUMPS, WEIRS 等"
}
```

### 主要元件結構說明

- **`DIMENSIONS`**: 定義了整個模型範圍的地理邊界。
  - `left_down`: 左下角座標 (TWD97, WGS84)。
  - `right_up`: 右上角座標 (TWD97, WGS84)。

- **`COORDINATES`**: 一個陣列，包含所有節點（如人孔、排放口）的地理資訊。

```json
    {
      "name": "節點ID",
      "x_97": "TWD97 X座標",
      "y_97": "TWD97 Y座標",
      "lng": "經度 (WGS84)",
      "lat": "緯度 (WGS84)"
    }
    ```

-   **`JUNCTIONS`**: 一個陣列，定義了匯流點（人孔）的屬性。
    ```json
    {
      "name": "匯流點ID",
      "Elevation": "管底高程",
      "MaxDepth": "最大深度",
      "InitDepth": "初始水深",
      "SurDepth": "溢淹深度",
      "Aponded": "積水面積"
    }
    ```

-   **`CONDUITS`**: 一個陣列，定義了管渠的屬性。
    ```json
    {
      "name": "管渠ID",
      "From": "上游節點ID",
      "To": "下游節點ID",
      "Length": "長度",
      "Roughness": "糙率",
      "InOffset": "入口管底偏移",
      "OutOffset": "出口管底偏移"
    }
    ```

-   **`XSECTIONS`**: 一個陣列，定義了管渠的斷面形狀與尺寸。
    ```json
    {
      "Link": "對應的管渠ID",
      "Shape": "斷面形狀 (e.g., CIRCULAR, RECT_CLOSED)",
      "Geom1": "幾何參數1 (e.g., 直徑或高度)",
      "Geom2": "幾何參數2 (e.g., 寬度)",
      "Barrels": "管數"
    }
    ```

## DFS_Paths.json 路徑搜尋結果說明
路徑搜尋的結果會儲存於 `MapDisplay/Data/DFS_Paths.json` 檔案中。此檔案包含一個 JSON 陣列，陣列中的每個物件代表一條從起點到終點的獨立路徑。

### 路徑物件 (`Path Object`) 結構

```json
{
    "Version": "描述資訊，例如演算法版本",
    "ProjectId": "專案ID",
    "SWMMInpFile": "來源的 SWMM inp 檔案路徑",
    "StartNode": "路徑起始節點ID",
    "EndNode": "路徑終點節點ID",
    "PublishDate": "資料產生日期",
    "LinkIds": ["組成路徑的管渠ID列表"],
    "NodeIds": ["組成路徑的節點ID列表"],
    "PNodes": [
        {
            "ID": "節點ID",
            "type": "節點類型 (e.g., JUNCTION, OUTFALL)",
            "Invert": "管底高程",
            "MaxDepth": "最大深度",
            "aLink": ["與此節點相連的所有管渠ID"],
            "PathLength": "從起點開始的步數 (索引)",
            "TopElevation": "頂部高程"
        }
    ],
    "PLinks": [
        {
            "ID": "管渠ID",
            "Type": "管渠類型 (e.g., CONDUIT)",
            "FromNode": "上游節點ID",
            "ToNode": "下游節點ID",
            "Length": "管渠長度"
        }
    ],
    "Message": "處理結果訊息 (e.g., OK)"
}
```

## 如何使用

1. 將 SWMM 的 `.TY_DMCREEK.json` 檔案放置到指定的 `data` 目錄下。
2. 在應用程式中設定專案、起始節點與終點節點。
3. 執行路徑搜尋功能。
4. 結果將會顯示在地圖上，並產生對應的 `DFS_Paths.json` 檔案。
﻿

