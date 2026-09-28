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
        const headers = ['Thời gian', 'Nhiệt độ (°C)', 'Độ ẩm không khí (%)', 'Độ ẩm đất (%)', 'Ánh sáng (lux)', 'Mực nước (%)', 'Khói gas (ppm)'];
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
        const zoneId = selectEl.value;
        State.setActiveZone(zoneId);
        const active = State.getActiveZone();

        UI.renderActiveZoneBanner(State);
        UI.addLog('info', `Đang theo dõi ${active.name}: ${active.cropName} (${active.cropIcon})`);
        UI.showToast(`Đã chuyển sang ${active.name} (${active.cropName})`, 'success');

        // Automatically apply this zone's recommended thresholds
        if (active.thresholds) {
            Service.saveThresholds(active.thresholds);
            UI.syncThresholdInputs(State.thresholds);
            UI.showToast(`Đã áp dụng ngưỡng sinh trưởng cho ${active.cropName}`, 'info');
        }
    }

    function openZoneModal(targetZoneId) {
        UI.openZoneModal(targetZoneId);
    }

    function closeZoneModal() {
        UI.closeZoneModal();
    }

    function handleCropPresetSelect(selectEl) {
        const cropKey = selectEl.value;
        const preset = Config.CROP_PRESETS[cropKey];
        if (!preset) return;

        document.getElementById('editCropName').value = preset.name;
        document.getElementById('editCropIcon').value = preset.icon;
        document.getElementById('editGrowthStage').value = preset.stage;

        if (preset.thresholds) {
            document.getElementById('modalThreshTempHigh').value = preset.thresholds.tempHigh;
            document.getElementById('modalThreshTempLow').value = preset.thresholds.tempLow;
            document.getElementById('modalThreshHumLow').value = preset.thresholds.humLow;
            document.getElementById('modalThreshHumHigh').value = preset.thresholds.humHigh;
            document.getElementById('modalThreshSoilLow').value = preset.thresholds.soilLow;
            document.getElementById('modalThreshSoilHigh').value = preset.thresholds.soilHigh;
            document.getElementById('modalThreshLightLow').value = preset.thresholds.lightLow;
            document.getElementById('modalThreshLightHigh').value = preset.thresholds.lightHigh;
        }

        UI.showToast(`Đã nạp thông số tiêu chuẩn cho: ${preset.name}`, 'info');
    }

    async function handleSaveZoneSettings() {
        const zoneId = document.getElementById('editZoneId').value;
        const name = document.getElementById('editZoneName').value.trim() || 'Khu Vườn';
        const cropName = document.getElementById('editCropName').value.trim() || 'Cây Trồng';
        const cropIcon = document.getElementById('editCropIcon').value.trim() || '🌱';
        const stage = document.getElementById('editGrowthStage').value.trim();
        const plantingDate = document.getElementById('editPlantingDate').value.trim();
        const cropType = document.getElementById('editCropPresetSelect').value;

        const thresholds = {
            tempHigh: parseFloat(document.getElementById('modalThreshTempHigh').value) || 32,
            tempLow: parseFloat(document.getElementById('modalThreshTempLow').value) || 22,
            humLow: parseFloat(document.getElementById('modalThreshHumLow').value) || 50,
            humHigh: parseFloat(document.getElementById('modalThreshHumHigh').value) || 75,
            soilLow: parseFloat(document.getElementById('modalThreshSoilLow').value) || 40,
            soilHigh: parseFloat(document.getElementById('modalThreshSoilHigh').value) || 70,
            lightLow: parseFloat(document.getElementById('modalThreshLightLow').value) || 400,
            lightHigh: parseFloat(document.getElementById('modalThreshLightHigh').value) || 1200,
            waterLow: State.thresholds.waterLow,
            gasHigh: State.thresholds.gasHigh
        };

        const updated = State.updateZone(zoneId, {
            name,
            cropName,
            cropIcon,
            stage,
            plantingDate,
            cropType,
            thresholds
        });

        // If saving the active zone, immediately update live thresholds too
        if (zoneId === State.activeZoneId) {
            await Service.saveThresholds(thresholds);
            UI.syncThresholdInputs(State.thresholds);
        }

        // Save ESP32 Hardware IP if provided
        const ipInput = document.getElementById('cfgEsp32Ip');
        if (ipInput) {
            const rawIp = ipInput.value.trim();
            if (rawIp) {
                let formattedIp = rawIp;
                if (!formattedIp.startsWith('http://') && !formattedIp.startsWith('https://')) {
                    formattedIp = `http://${formattedIp}`;
                }
                formattedIp = formattedIp.replace(/\/+$/, '');
                localStorage.setItem('greenhouse_esp32_ip', formattedIp);
            } else {
                localStorage.removeItem('greenhouse_esp32_ip');
            }
        }

        UI.renderZoneDropdown(State);
        UI.renderActiveZoneBanner(State);
        UI.closeZoneModal();

        UI.addLog('info', `Đã cập nhật cài đặt ${name}: Trồng ${cropName} (${cropIcon})`);
        UI.showToast(`Đã lưu cài đặt ${name} thành công!`, 'success');
    }

    /**
     * Test HTTP connection to physical ESP32
     */
    async function testEsp32Connection() {
        const ipInput = document.getElementById('cfgEsp32Ip');
        let ip = ipInput ? ipInput.value.trim() : '';
        if (!ip) {
            UI.showToast('Vui lòng nhập địa chỉ IP của ESP32 (ví dụ: 192.168.1.50)', 'warning');
            return;
        }
        if (!ip.startsWith('http://') && !ip.startsWith('https://')) {
            ip = `http://${ip}`;
        }
        ip = ip.replace(/\/+$/, '');

        UI.showToast(`Đang thử kết nối tới ${ip}...`, 'info');
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`${ip}/sensors`, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                localStorage.setItem('greenhouse_esp32_ip', ip);
                UI.showToast(`✅ Kết nối thành công tới ESP32 (${ip})!`, 'success');
                UI.addLog('info', `Đã kết nối thành công vi điều khiển ESP32 tại ${ip}`);
                Service.fetchTelemetry();
            } else {
                UI.showToast(`Phản hồi mã ${res.status} từ ${ip}`, 'warning');
            }
        } catch (err) {
            UI.showToast(`❌ Không kết nối được tới ${ip}. Hãy kiểm tra WiFi!`, 'error');
        }
    }

    async function handleApplyZoneThresholds() {
        const zoneId = document.getElementById('editZoneId').value;
        const zone = State.zones.find(z => z.id === zoneId);
        if (!zone || !zone.thresholds) return;

        State.setActiveZone(zoneId);
        await Service.saveThresholds(zone.thresholds);
        UI.syncThresholdInputs(State.thresholds);
        UI.renderZoneDropdown(State);
        UI.renderActiveZoneBanner(State);
        UI.closeZoneModal();

        UI.addLog('warning', `Đã kích hoạt toàn bộ ngưỡng tối ưu cho ${zone.cropName}`);
        UI.showToast(`Đã áp dụng ngưỡng của ${zone.cropName} vào hệ thống!`, 'success');
    }

    function handleAddNewZone() {
        const count = State.zones.length + 1;
        const letter = String.fromCharCode(64 + count);
        const newZone = State.addZone({
            name: `Khu ${letter}`,
            cropName: 'Dâu Tây Đà Lạt',
            cropType: 'strawberry',
            cropIcon: '🍓',
            stage: 'Cây con',
            plantingDate: new Date().toLocaleDateString('vi-VN'),
            thresholds: Config.CROP_PRESETS.strawberry.thresholds
        });

        UI.renderZoneDropdown(State);
        UI.renderZoneModalContent(State, newZone.id);
        UI.showToast(`Đã tạo thêm ${newZone.name}!`, 'success');
    }

    function handleDeleteCurrentZone() {
        const zoneId = document.getElementById('editZoneId').value;
        if (State.zones.length <= 1) {
            UI.showToast('Không thể xóa phân khu cuối cùng!', 'warning');
            return;
        }

        if (confirm('Bạn có chắc muốn xóa phân khu này khỏi danh sách?')) {
            State.deleteZone(zoneId);
            UI.renderZoneDropdown(State);
            UI.renderActiveZoneBanner(State);
            UI.renderZoneModalContent(State, State.activeZoneId);
            UI.showToast('Đã xóa phân khu!', 'info');
        }
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
     * Smooth scroll accurately to any section with header offset and visual pulse
     */
    function scrollToSection(targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;

        const header = document.querySelector('.app-header');
        const headerHeight = header ? header.offsetHeight : 70;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 16;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Update active nav-link state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            }
        });

        // Add soft highlight pulse effect
        el.classList.add('section-highlight');
        setTimeout(() => el.classList.remove('section-highlight'), 1800);
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
    window.scrollToSection = scrollToSection;

    window.openZoneModal = openZoneModal;
    window.closeZoneModal = closeZoneModal;
    window.handleCropPresetSelect = handleCropPresetSelect;
    window.handleSaveZoneSettings = handleSaveZoneSettings;
    window.handleApplyZoneThresholds = handleApplyZoneThresholds;
    window.handleAddNewZone = handleAddNewZone;
    window.handleDeleteCurrentZone = handleDeleteCurrentZone;
    window.testEsp32Connection = testEsp32Connection;

    /**
     * Main Application Initialization
     */
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Initialize UI elements
        UI.initClock();
        UI.renderZoneDropdown(State);
        UI.renderActiveZoneBanner(State);
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
                case 'zones':
                case 'activeZone':
                    UI.renderZoneDropdown(state);
                    UI.renderActiveZoneBanner(state);
                    break;
            }
        });

        // 4. Initial System Logs
        const currentZone = State.getActiveZone();
        UI.addLog('info', `🌿 Trạm quan trắc Nhà Kính Thông Minh đã sẵn sàng (Phân khu: ${currentZone.name})`);
        UI.addLog('info', `🌱 Cây trồng mục tiêu: ${currentZone.cropName} (${currentZone.stage || 'Sinh trưởng'})`);
        UI.addLog('info', 'Đang kết nối vi điều khiển ESP32...');

        // 5. Initial Telemetry query & start polling loop
        runTelemetryTick();
        pollingTimer = setInterval(runTelemetryTick, Config.REFRESH_INTERVAL_MS);
    });
})(window);
