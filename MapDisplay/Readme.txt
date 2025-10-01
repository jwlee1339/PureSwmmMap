* 繪製SWMM平面圖網頁

* HTML : SwmmMap.HTML
* 新增一個SWMM區域
  1. 在Data資料夾增加SWMM基本資料json
  2. 在PathData資料夾增加SWMM 路徑 json
  3. 在GetBaseData.js 增加一段原始碼:
        else if (value === "Daan_2_new") {
            Base.data = Daan_2_new;
        }
  4. 在GetPathData.js 增加一段原始碼:
        else if (value === "Daan_2_new") {
        Path.data = Daan_2_new_path;
        }

* NOTE : 網頁會先呼叫GetProjectNamesFromServer 函式取得專案名稱及說明，
  請記住在資料表"DEMO_description"，增加一筆資料，指定專案名稱及說明。
  其中欄位"firstpeakreduce"若為-9999，網頁將不會使用此專案。

* NOTE : 路徑搜尋API會從資料庫取得SWMM INP 檔案名稱，請記得在
  資料表"swmminpfiles"中，增加一筆資料，指定專案名稱及SWMM INP
  檔案名稱。


* 找到預報日期時間 SQL
SELECT fcsttime
FROM "DM_2023".subresults
where projectid = 'TY_DMCREEK' and inittime = '2023-08-10 16:40'
group by fcsttime order by fcsttime 