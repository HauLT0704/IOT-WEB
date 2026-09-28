/**
 * ====================================================================
 * Nhà Kính Thông Minh - Application Bootstrapper & Event Orchestrator
 * Full Navbar Controls, Presets, Visual Sliders & Master Operations
 * ====================================================================
 */

'use strict';

(function(window) {
    const Config = window.GreenhouseConfig;
    const State = window.GreenhouseState;
    const UI = window.GreenhouseUI;
    const Service = window.GreenhouseService;
    const Chart = window.GreenhouseChart;

    let pollingTimer = null;

    /**
     * Dispatch device control when toggle is flipped
     */
    async function handleDeviceToggle(deviceId, nextState) {
        if (State.modes[deviceId] === 'auto') {
            UI.showToast('Vui lòng chuyển sang Thủ công để điều khiển trực tiếp', 'warning');
            const cap = deviceId.charAt(0).toUpperCase() + deviceId.slice(1);
            const toggle = document.getElementById(`toggle${cap}`);
            if (toggle) toggle.checked = State.devices[deviceId];
            return;
        }

        const devMeta = Config.DEVICES[deviceId] || { name: deviceId };
        await Service.setDeviceRelay(deviceId, nextState);
        UI.addLog('info', `${devMeta.name} đã ${nextState ? 'BẬT' : 'TẮT'} (thủ công)`);
        UI.showToast(`${devMeta.name} đã ${nextState ? 'bật' : 'tắt'}`, 'success');
    }

    /**
     * Change device operation mode (auto / manual)
     */
    async function handleModeChange(deviceId, mode) {
        const devMeta = Config.DEVICES[deviceId] || { name: deviceId };
        await Service.setDeviceMode(deviceId, mode);
        const modeLabel = mode === 'auto' ? 'Tự động' : 'Thủ công';
        UI.addLog('info', `${devMeta.name}: chuyển sang ${modeLabel}`);
        UI.showToast(`${devMeta.name} → ${modeLabel}`, 'success');
    }

    /**
     * Stepper increment/decrement helper
     */
    function stepThresh(inputId, sliderId, delta, min, max) {
        UI.stepThreshold(inputId, sliderId, delta, min, max);
    }

    /**
     * Two-way synchronization between slider and number input
     */
    function syncSlider(sliderEl, targetInputId) {
        const input = document.getElementById(targetInputId);
        if (input) input.value = sliderEl.value;
    }

    function syncInput(inputEl, targetSliderId) {
        const slider = document.getElementById(targetSliderId);
        if (slider) slider.value = inputEl.value;
    }

    /**
     * Save sensor threshold limits
     */
    async function handleThresholdSave(sensorCategory) {
        const payload = {};

        switch (sensorCategory) {
            case 'temp':
                payload.tempHigh = parseFloat(document.getElementById('threshTempHigh').value);
                payload.tempLow = parseFloat(document.getElementById('threshTempLow').value);
                break;
            case 'humidity':
                payload.humLow = parseFloat(document.getElementById('threshHumLow').value);
                payload.humHigh = parseFloat(document.getElementById('threshHumHigh').value);
                break;
            case 'soil':
                payload.soilLow = parseFloat(document.getElementById('threshSoilLow').value);
                payload.soilHigh = parseFloat(document.getElementById('threshSoilHigh').value);
                break;
            case 'light':
                payload.lightLow = parseFloat(document.getElementById('threshLightLow').value);
                payload.lightHigh = parseFloat(document.getElementById('threshLightHigh').value);
                break;
            case 'water':
                payload.waterLow = parseFloat(document.getElementById('threshWaterLow').value);
                break;
            case 'gas':
                payload.gasHigh = parseFloat(document.getElementById('threshGasHigh').value);
                break;
        }

        await Service.saveThresholds(payload);
        const meta = Config.SENSORS[sensorCategory];
        UI.addLog('info', `Đã cập nhật ngưỡng: ${meta ? meta.name : sensorCategory}`);
        UI.showToast(`Lưu ngưỡng ${meta ? meta.name : ''} thành công!`, 'success');
    }

    /**
     * Apply Scenario Presets
     */
    const PRESETS = {
        standard: {
            name: 'Tiêu chuẩn',
            thresholds: { tempHigh: 35, tempLow: 28, humLow: 10, humHigh: 50, soilLow: 30, soilHigh: 70, lightLow: 300, lightHigh: 1000, waterLow: 5, gasHigh: 400 }
        },
        summer: {
            name: 'Mùa hè nắng nóng',
            thresholds: { tempHigh: 30, tempLow: 25, humLow: 20, humHigh: 65, soilLow: 45, soilHigh: 80, lightLow: 400, lightHigh: 1200, waterLow: 10, gasHigh: 400 }
        },
        rainy: {
            name: 'Mùa mưa ẩm',
            thresholds: { tempHigh: 33, tempLow: 26, humLow: 30, humHigh: 85, soilLow: 25, soilHigh: 60, lightLow: 200, lightHigh: 800, waterLow: 8, gasHigh: 400 }
        },
        nursery: {
            name: 'Vườn ươm cây con',
            thresholds: { tempHigh: 28, tempLow: 22, humLow: 35, humHigh: 75, soilLow: 50, soilHigh: 80, lightLow: 500, lightHigh: 1500, waterLow: 15, gasHigh: 350 }
        }
    };

    async function applyPreset(presetKey) {
        const preset = PRESETS[presetKey];
        if (!preset) return;

        document.querySelectorAll('.preset-chip').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-preset') === presetKey);
        });

        await Service.saveThresholds(preset.thresholds);
        UI.syncThresholdInputs(State.thresholds);
        UI.addLog('warning', `Đã kích hoạt kịch bản: ${preset.name}`);
        UI.showToast(`Đã áp dụng kịch bản ${preset.name}`, 'success');
    }

    /**
     * Master Toolbar Operations
     */
    async function setAllDevicesMode(mode) {
        const devices = ['pump', 'fan', 'led', 'buzzer'];
        for (const dev of devices) {
            await Service.setDeviceMode(dev, mode);
        }
        const label = mode === 'auto' ? 'Tất cả Tự động' : 'Tất cả Thủ công';
        UI.addLog('info', `Đã chuyển toàn bộ thiết bị sang: ${label}`);
        UI.showToast(label, 'success');
    }

    async function emergencyStop() {
        const devices = ['pump', 'fan', 'led', 'buzzer'];
        for (const dev of devices) {
            await Service.setDeviceMode(dev, 'manual');
            await Service.setDeviceRelay(dev, false);
        }
        UI.addLog('danger', '🛑 DỪNG KHẨN CẤP: Đã ngắt toàn bộ relay thiết bị!');
        UI.showToast('Đã dừng khẩn cấp toàn bộ thiết bị!', 'error');
    }

    async function turnAllOn() {
        const devices = ['pump', 'fan', 'led'];
        for (const dev of devices) {
            await Service.setDeviceMode(dev, 'manual');
            await Service.setDeviceRelay(dev, true);
        }
        UI.addLog('info', '⚡ Bật thủ công tất cả thiết bị (Bơm, Quạt, Đèn)!');
        UI.showToast('Đã bật tất cả thiết bị', 'success');
    }

    /**
     * Quick Toolbar Buttons
     */
    async function refreshData() {
        const btn = document.getElementById('btnRefresh');
        if (btn) btn.classList.add('spinning');
        await runTelemetryTick();
        setTimeout(() => {
            if (btn) btn.classList.remove('spinning');
            UI.showToast('Dữ liệu đã được làm mới', 'success');
        }, 500);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    function exportTelemetryCSV() {
        const headers = ['Thời gian', 'Nhiệt độ (°C)', 'Độ ẩm KK (%)', 'Độ ẩm đất (%)', 'Ánh sáng (lux)', 'Mực nước (%)', 'Khói gas (ppm)'];
        const rows = State.chartData.labels.map((time, idx) => [
            time,
            State.chartData.temp[idx] || 0,
            State.chartData.humidity[idx] || 0,
            State.chartData.soil[idx] || 0,
            State.chartData.light[idx] || 0,
            State.chartData.water[idx] || 0,
            State.chartData.gas[idx] || 0
        ]);

        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `nha_kinh_telemetry_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        UI.showToast('Đã xuất file báo cáo telemetry CSV!', 'success');
    }

    function handleZoneChange(selectEl) {
        const zoneName = selectEl.options[selectEl.selectedIndex].text;
        UI.addLog('info', `Đang theo dõi: ${zoneName}`);
        UI.showToast(`Đã chuyển sang ${zoneName}`, 'success');
    }

    function triggerTestAlert() {
        const prevGas = State.sensors.gas;
        State.sensors.gas = 650;
        UI.renderAlerts(State);
        UI.showToast('Đang phát tín hiệu thử nghiệm cảnh báo khí gas!', 'warning');
        setTimeout(() => {
            State.sensors.gas = prevGas;
            UI.renderAlerts(State);
        }, 4000);
    }

    /**
     * Periodic telemetry update tick
     */
    async function runTelemetryTick() {
        await Service.fetchTelemetry();
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        State.pushChartReading(timeLabel);
    }

    /**
     * Attach global helper methods to window
     */
    window.toggleDevice = handleDeviceToggle;
    window.setMode = handleModeChange;
    window.saveThresholds = handleThresholdSave;
    window.switchChart = (sensorId) => Chart.switchTab(sensorId);
    window.dismissAlert = () => UI.dismissAlert();

    window.stepThresh = stepThresh;
    window.syncSlider = syncSlider;
    window.syncInput = syncInput;

    window.applyPreset = applyPreset;
    window.setAllDevicesMode = setAllDevicesMode;
    window.emergencyStop = emergencyStop;
    window.turnAllOn = turnAllOn;

    window.refreshData = refreshData;
    window.toggleFullscreen = toggleFullscreen;
    window.exportTelemetryCSV = exportTelemetryCSV;
    window.handleZoneChange = handleZoneChange;
    window.triggerTestAlert = triggerTestAlert;

    /**
     * Main Application Initialization
     */
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Initialize UI elements
        UI.initClock();
        UI.syncThresholdInputs(State.thresholds);
        UI.renderDevices(State);
        UI.renderSensors(State);
        UI.renderConnection(State.isConnected);

        // 2. Initialize Chart
        Chart.init('sensorChart');

        // 3. Register State change subscribers
        State.subscribe((state, changeType) => {
            switch (changeType) {
                case 'connection':
                    UI.renderConnection(state.isConnected);
                    break;
                case 'sensors':
                    UI.renderSensors(state);
                    UI.renderAlerts(state);
                    break;
                case 'devices':
                case 'modes':
                    UI.renderDevices(state);
                    break;
                case 'thresholds':
                    UI.syncThresholdInputs(state.thresholds);
                    UI.renderSensors(state);
                    UI.renderAlerts(state);
                    break;
                case 'chart':
                    Chart.update();
                    break;
            }
        });

        // 4. Initial System Logs
        UI.addLog('info', '🌿 Trạm quan trắc Nhà Kính Thông Minh đã sẵn sàng');
        UI.addLog('info', 'Đang kết nối vi điều khiển ESP32...');

        // 5. Initial Telemetry query & start polling loop
        runTelemetryTick();
        pollingTimer = setInterval(runTelemetryTick, Config.REFRESH_INTERVAL_MS);
    });
})(window);
