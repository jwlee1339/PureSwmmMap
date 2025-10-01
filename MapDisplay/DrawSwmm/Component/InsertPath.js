// InsertPath.js
// 2023-10-29
// 儲存路徑節點到DB

import { RequestInsPath, RequestQueryPath } from '../../RequestData.js';
import { Utils } from '../../Utils.js';


// todo 改寫為使用 C# WebView2


export function QueryPaths(ProfId) {
  
    // 路徑名稱 : ex.'D19~D13'
    let Prof_id = `Test3`;
    
    // 向後端請求資料, 資料夾是相對於html
    RequestQueryPath(Prof_id);
}