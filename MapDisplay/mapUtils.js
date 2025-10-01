// mapUtils.js
// 共用地圖工具函式

/**
 * 讓 Leaflet 圖層的邊界閃爍幾下以示強調。
 * @param {L.Path} layer - 要閃爍的 Leaflet 路徑圖層 (e.g., polygon, polyline)。
 * @param {object} [options={}] - 閃爍選項。
 * @param {string} [options.flashColor='#e51c23'] - 閃爍時的顏色。
 * @param {number} [options.flashWeight=3] - 閃爍時的線寬。
 * @param {number} [options.flashes=3] - 閃爍次數 (亮/暗為一次)。
 * @param {number} [options.interval=150] - 閃爍間隔 (ms)。
 */
export function flashLayer(layer, options = {}) {
    const defaults = {
        flashColor: '#e51c23', // 亮紅色
        flashWeight: 3,
        flashes: 3,
        interval: 150
    };
    const settings = { ...defaults, ...options };

    const originalBorderStyle = {
        color: layer.options.color,
        weight: layer.options.weight
    };
    const flashBorderStyle = {
        color: settings.flashColor,
        weight: settings.flashWeight
    };

    let flashCount = 0;
    const maxFlashes = settings.flashes * 2;

    const flash = () => {
        if (flashCount >= maxFlashes) {
            layer.setStyle(originalBorderStyle);
            return;
        }
        layer.setStyle(flashCount % 2 === 0 ? flashBorderStyle : originalBorderStyle);
        flashCount++;
        setTimeout(flash, settings.interval);
    };

    flash();
}