/**
 * ====================================================================
 * Nhà Kính Thông Minh - UI Presentation & DOM Renderer (Enhanced Visuals)
 * Clean Code Principle: Encapsulated UI Layer with Cached DOM Selectors
 * ====================================================================
 */

'use strict';

(function(window) {
    const Config = window.GreenhouseConfig;

    // Cache essential DOM references
    const DOM = {
        clock: document.getElementById('clock'),
        headerDate: document.getElementById('headerDate'),
        connectionBadge: document.getElementById('connectionBadge'),
        connectionText: document.getElementById('connectionText'),
        alertBanner: document.getElementById('alertBanner'),
        alertText: document.getElementById('alertText'),
        logContainer: document.getElementById('logContainer'),
        toastContainer: document.getElementById('toastContainer'),

        // Sensor Value Elements
        valTemp: document.getElementById('valTemp'),
        barTemp: document.getElementById('barTemp'),
        badgeTemp: document.getElementById('badgeTemp'),

        valHumidity: document.getElementById('valHumidity'),
        barHumidity: document.getElementById('barHumidity'),
        badgeHumidity: document.getElementById('badgeHumidity'),

        valSoil: document.getElementById('valSoil'),
        barSoil: document.getElementById('barSoil'),
        badgeSoil: document.getElementById('badgeSoil'),

        valLight: document.getElementById('valLight'),
        barLight: document.getElementById('barLight'),
        badgeLight: document.getElementById('badgeLight'),

        valWater: document.getElementById('valWater'),
        barWater: document.getElementById('barWater'),
        badgeWater: document.getElementById('badgeWater'),

        valGas: document.getElementById('valGas'),
        barGas: document.getElementById('barGas'),
        badgeGas: document.getElementById('badgeGas'),

        // Threshold Inputs & Sliders
        threshTempHigh: document.getElementById('threshTempHigh'),
        rangeTempHigh: document.getElementById('rangeTempHigh'),
        threshTempLow: document.getElementById('threshTempLow'),
        rangeTempLow: document.getElementById('rangeTempLow'),

        threshHumLow: document.getElementById('threshHumLow'),
        rangeHumLow: document.getElementById('rangeHumLow'),
        threshHumHigh: document.getElementById('threshHumHigh'),
        rangeHumHigh: document.getElementById('rangeHumHigh'),

        threshSoilLow: document.getElementById('threshSoilLow'),
        rangeSoilLow: document.getElementById('rangeSoilLow'),
        threshSoilHigh: document.getElementById('threshSoilHigh'),
        rangeSoilHigh: document.getElementById('rangeSoilHigh'),

        threshLightLow: document.getElementById('threshLightLow'),
        rangeLightLow: document.getElementById('rangeLightLow'),
        threshLightHigh: document.getElementById('threshLightHigh'),
        rangeLightHigh: document.getElementById('rangeLightHigh'),

        threshWaterLow: document.getElementById('threshWaterLow'),
        rangeWaterLow: document.getElementById('rangeWaterLow'),

        threshGasHigh: document.getElementById('threshGasHigh'),
        rangeGasHigh: document.getElementById('rangeGasHigh')
    };

    function updateBadge(badgeElement, text, modifier, icon) {
        if (!badgeElement) return;
        badgeElement.innerHTML = `${icon || ''} ${text}`;
        badgeElement.className = `status-badge status-badge--${modifier}`;
    }

    const GreenhouseUI = {
        /**
         * Initialize clock & date loop
         */
        initClock() {
            const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const render = () => {
                const now = new Date();
                if (DOM.clock) {
                    DOM.clock.textContent = now.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
                if (DOM.headerDate) {
                    const day = daysOfWeek[now.getDay()];
                    const dateStr = now.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    DOM.headerDate.textContent = `${day}, ${dateStr}`;
                }
            };
            render();
            setInterval(render, 1000);
        },

        /**
         * Render connection badge
         */
        renderConnection(isConnected) {
            if (!DOM.connectionBadge || !DOM.connectionText) return;
            if (isConnected) {
                DOM.connectionBadge.className = 'app-header__status-badge app-header__status-badge--connected';
                DOM.connectionText.textContent = 'Đã kết nối ESP32';
            } else {
                DOM.connectionBadge.className = 'app-header__status-badge app-header__status-badge--demo';
                DOM.connectionText.textContent = 'Chế độ Demo';
            }
        },

        /**
         * Render real-time sensor metrics, progress bars and status badges
         */
        renderSensors(state) {
            const { sensors, thresholds } = state;

            // Temperature
            if (DOM.valTemp) DOM.valTemp.textContent = sensors.temp.toFixed(1);
            if (DOM.barTemp) DOM.barTemp.style.width = `${Math.min((sensors.temp / 50) * 100, 100)}%`;
            updateBadge(
                DOM.badgeTemp,
                sensors.temp >= thresholds.tempHigh ? 'Quá Nhiệt' : sensors.temp <= 10 ? 'Quá Lạnh' : 'Tối Ưu',
                sensors.temp >= thresholds.tempHigh ? 'danger' : sensors.temp <= 10 ? 'warning' : 'good',
                sensors.temp >= thresholds.tempHigh ? '🔥' : '✨'
            );

            // Humidity
            if (DOM.valHumidity) DOM.valHumidity.textContent = sensors.humidity.toFixed(1);
            if (DOM.barHumidity) DOM.barHumidity.style.width = `${Math.min(sensors.humidity, 100)}%`;
            updateBadge(
                DOM.badgeHumidity,
                sensors.humidity < thresholds.humLow ? 'Hanh Khô' : sensors.humidity > 90 ? 'Quá Ẩm' : 'Ổn Định',
                sensors.humidity < thresholds.humLow ? 'warning' : sensors.humidity > 90 ? 'danger' : 'good',
                '💧'
            );

            // Soil Moisture
            if (DOM.valSoil) DOM.valSoil.textContent = sensors.soil.toFixed(0);
            if (DOM.barSoil) DOM.barSoil.style.width = `${Math.min(sensors.soil, 100)}%`;
            updateBadge(
                DOM.badgeSoil,
                sensors.soil <= thresholds.soilLow ? 'Thiếu Nước' : sensors.soil >= thresholds.soilHigh ? 'Ngập Úng' : 'Màu Mỡ',
                sensors.soil <= thresholds.soilLow ? 'danger' : sensors.soil >= thresholds.soilHigh ? 'warning' : 'good',
                '🌱'
            );

            // Light (Lux)
            if (DOM.valLight) DOM.valLight.textContent = sensors.light.toFixed(0);
            if (DOM.barLight) DOM.barLight.style.width = `${Math.min((sensors.light / 65535) * 100, 100)}%`;
            updateBadge(
                DOM.badgeLight,
                sensors.light <= thresholds.lightLow ? 'Thiếu Sáng' : sensors.light >= thresholds.lightHigh ? 'Nắng Gắt' : 'Lý Tưởng',
                sensors.light <= thresholds.lightLow ? 'warning' : 'good',
                '☀️'
            );

            // Water Level
            if (DOM.valWater) DOM.valWater.textContent = sensors.water.toFixed(0);
            if (DOM.barWater) DOM.barWater.style.width = `${Math.min(sensors.water, 100)}%`;
            updateBadge(
                DOM.badgeWater,
                sensors.water <= thresholds.waterLow ? 'Bể Cạn' : sensors.water <= 30 ? 'Mức Thấp' : 'Bể Đầy',
                sensors.water <= thresholds.waterLow ? 'danger' : sensors.water <= 30 ? 'warning' : 'info',
                '🚰'
            );

            // Smoke / Gas (MQ-2)
            if (DOM.valGas) DOM.valGas.textContent = sensors.gas.toFixed(0);
            if (DOM.barGas) DOM.barGas.style.width = `${Math.min((sensors.gas / 1000) * 100, 100)}%`;
            updateBadge(
                DOM.badgeGas,
                sensors.gas >= thresholds.gasHigh ? 'Báo Động' : sensors.gas >= thresholds.gasHigh * 0.7 ? 'Chú Ý' : 'Trong Lành',
                sensors.gas >= thresholds.gasHigh ? 'danger' : sensors.gas >= thresholds.gasHigh * 0.7 ? 'warning' : 'good',
                '🛡️'
            );
        },

        /**
         * Render device toggle switches, statuses and active mode buttons
         * Also toggle .device-card--active for dynamic animations!
         */
        renderDevices(state) {
            const devices = ['pump', 'fan', 'led', 'buzzer'];

            devices.forEach(dev => {
                const cap = dev.charAt(0).toUpperCase() + dev.slice(1);
                const card = document.getElementById(`devCard${cap}`);
                const toggle = document.getElementById(`toggle${cap}`);
                const status = document.getElementById(`status${cap}`);
                const autoBtn = document.getElementById(`${dev}Auto`);
                const manualBtn = document.getElementById(`${dev}Manual`);

                const isOn = state.devices[dev];
                const isAuto = state.modes[dev] === 'auto';

                // Animated active state class
                if (card) {
                    if (isOn) {
                        card.classList.add('device-card--active');
                    } else {
                        card.classList.remove('device-card--active');
                    }
                }

                if (toggle) {
                    toggle.checked = isOn;
                    toggle.disabled = isAuto;
                    if (toggle.parentElement) {
                        toggle.parentElement.style.opacity = isAuto ? '0.45' : '1';
                        toggle.parentElement.style.cursor = isAuto ? 'not-allowed' : 'pointer';
                    }
                }

                if (status) {
                    status.className = `device-card__status ${isOn ? 'device-card__status--on' : 'device-card__status--off'}`;
                    status.innerHTML = `<span class="device-card__status-dot"></span> ${isOn ? 'Đang hoạt động' : 'Tạm dừng'}`;
                }

                if (autoBtn && manualBtn) {
                    if (isAuto) {
                        autoBtn.classList.add('mode-btn--active');
                        manualBtn.classList.remove('mode-btn--active');
                    } else {
                        autoBtn.classList.remove('mode-btn--active');
                        manualBtn.classList.add('mode-btn--active');
                    }
                }
            });
        },

        /**
         * Synchronize both input numbers and range sliders with thresholds
         */
        syncThresholdInputs(thresholds) {
            const syncPair = (inputEl, sliderEl, val) => {
                if (inputEl) inputEl.value = val;
                if (sliderEl) sliderEl.value = val;
            };

            syncPair(DOM.threshTempHigh, DOM.rangeTempHigh, thresholds.tempHigh);
            syncPair(DOM.threshTempLow, DOM.rangeTempLow, thresholds.tempLow);
            syncPair(DOM.threshHumLow, DOM.rangeHumLow, thresholds.humLow);
            syncPair(DOM.threshHumHigh, DOM.rangeHumHigh, thresholds.humHigh);
            syncPair(DOM.threshSoilLow, DOM.rangeSoilLow, thresholds.soilLow);
            syncPair(DOM.threshSoilHigh, DOM.rangeSoilHigh, thresholds.soilHigh);
            syncPair(DOM.threshLightLow, DOM.rangeLightLow, thresholds.lightLow);
            syncPair(DOM.threshLightHigh, DOM.rangeLightHigh, thresholds.lightHigh);
            syncPair(DOM.threshWaterLow, DOM.rangeWaterLow, thresholds.waterLow);
            syncPair(DOM.threshGasHigh, DOM.rangeGasHigh, thresholds.gasHigh);
        },

        /**
         * Step threshold value by delta
         */
        stepThreshold(inputId, sliderId, delta, min, max, step) {
            const input = document.getElementById(inputId);
            const slider = document.getElementById(sliderId);
            if (!input) return;

            let val = parseFloat(input.value) || 0;
            val = Math.round((val + delta) * 10) / 10;
            if (min !== undefined) val = Math.max(min, val);
            if (max !== undefined) val = Math.min(max, val);

            input.value = val;
            if (slider) slider.value = val;
        },

        /**
         * Check and show/hide emergency alerts
         */
        renderAlerts(state) {
            if (!DOM.alertBanner || !DOM.alertText) return;

            const msgs = [];
            if (state.sensors.gas >= state.thresholds.gasHigh) {
                msgs.push(`NỒNG ĐỘ KHÍ GAS CAO: ${state.sensors.gas.toFixed(0)} ppm (Còi cảnh báo đã kích hoạt)`);
            }
            if (state.sensors.water <= state.thresholds.waterLow) {
                msgs.push(`MỰC NƯỚC BỂ CHỨA CẠN: ${state.sensors.water.toFixed(0)}% (Cần bơm cấp nước)`);
            }
            if (state.sensors.temp >= state.thresholds.tempHigh) {
                msgs.push(`NHIỆT ĐỘ VƯỢT NGƯỠNG AN TOÀN: ${state.sensors.temp.toFixed(1)}°C (Quạt tản nhiệt đang chạy)`);
            }

            if (msgs.length > 0) {
                DOM.alertText.textContent = msgs.join('  ✦  ');
                DOM.alertBanner.classList.add('alert-banner--visible');
            } else {
                DOM.alertBanner.classList.remove('alert-banner--visible');
            }
        },

        /**
         * Dismiss alert banner manually
         */
        dismissAlert() {
            if (DOM.alertBanner) {
                DOM.alertBanner.classList.remove('alert-banner--visible');
            }
        },

        /**
         * Append timestamped activity log entry
         */
        addLog(type, message) {
            if (!DOM.logContainer) return;

            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const entry = document.createElement('div');
            entry.className = 'activity-log__entry';
            entry.innerHTML = `
                <span class="activity-log__time">${timeStr}</span>
                <span class="activity-log__dot activity-log__dot--${type}"></span>
                <span class="activity-log__message">${message}</span>
            `;

            DOM.logContainer.insertBefore(entry, DOM.logContainer.firstChild);

            while (DOM.logContainer.children.length > Config.MAX_LOG_ENTRIES) {
                DOM.logContainer.removeChild(DOM.logContainer.lastChild);
            }
        },

        /**
         * Render floating toast notification
         */
        showToast(message, type = 'success') {
            if (!DOM.toastContainer) return;

            const iconMap = {
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.innerHTML = `
                <span class="toast__icon">${iconMap[type] || 'ℹ️'}</span>
                <span class="toast__message">${message}</span>
            `;

            DOM.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'toastExit 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, Config.TOAST_DURATION_MS);
        },

        /**
         * Render Zone Selector dropdown in the Navbar
         */
        renderZoneDropdown(state) {
            const select = document.getElementById('zoneSelect');
            const iconEl = document.getElementById('zoneIcon');
            if (!select) return;

            select.innerHTML = '';
            state.zones.forEach(zone => {
                const opt = document.createElement('option');
                opt.value = zone.id;
                opt.textContent = `${zone.name} - ${zone.cropName}`;
                if (zone.id === state.activeZoneId) opt.selected = true;
                select.appendChild(opt);
            });

            const active = state.getActiveZone();
            if (iconEl && active) iconEl.textContent = active.cropIcon || '🌱';
        },

        /**
         * Render Active Zone & Crop Info Banner below preset bar
         */
        renderActiveZoneBanner(state) {
            const active = state.getActiveZone();
            const iconEl = document.getElementById('bannerCropIcon');
            const titleEl = document.getElementById('bannerZoneTitle');
            const metaEl = document.getElementById('bannerZoneMeta');

            if (iconEl && active) iconEl.textContent = active.cropIcon || '🌱';
            if (titleEl && active) titleEl.textContent = `${active.name} — ${active.cropName}`;
            if (metaEl && active) {
                metaEl.textContent = `Giai đoạn: ${active.stage || 'Phát triển'} • Trồng ngày: ${active.plantingDate || 'Hôm nay'} • Ngưỡng khuyến nghị tối ưu`;
            }
        },

        /**
         * Open and render the Zone & Crop Customization Modal
         */
        openZoneModal(targetZoneId) {
            const State = window.GreenhouseState;
            const modal = document.getElementById('zoneModal');
            if (!modal) return;

            const zoneId = targetZoneId || State.activeZoneId;
            this.renderZoneModalContent(State, zoneId);
            modal.classList.add('modal-overlay--open');
        },

        /**
         * Close Zone Customization Modal
         */
        closeZoneModal() {
            const modal = document.getElementById('zoneModal');
            if (modal) modal.classList.remove('modal-overlay--open');
        },

        /**
         * Populate Zone Customization Modal tabs and form content
         */
        renderZoneModalContent(state, currentZoneId) {
            const zoneTabs = document.getElementById('modalZoneTabs');
            const targetZone = state.zones.find(z => z.id === currentZoneId) || state.getActiveZone();
            if (!zoneTabs || !targetZone) return;

            // Render Zone Tabs
            zoneTabs.innerHTML = '';
            state.zones.forEach(z => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `modal-tab-btn ${z.id === targetZone.id ? 'modal-tab-btn--active' : ''}`;
                btn.innerHTML = `<span>${z.cropIcon || '🌱'}</span> ${z.name}`;
                btn.onclick = () => this.renderZoneModalContent(state, z.id);
                zoneTabs.appendChild(btn);
            });

            // Add Zone button
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'modal-tab-btn modal-tab-btn--add';
            addBtn.innerHTML = '<span>➕</span> Thêm khu mới';
            addBtn.onclick = () => window.handleAddNewZone();
            zoneTabs.appendChild(addBtn);

            // Populate Form Fields
            document.getElementById('editZoneId').value = targetZone.id;
            document.getElementById('editZoneName').value = targetZone.name;
            document.getElementById('editCropName').value = targetZone.cropName;
            document.getElementById('editCropIcon').value = targetZone.cropIcon || '🥬';
            document.getElementById('editGrowthStage').value = targetZone.stage || 'Phát triển';
            document.getElementById('editPlantingDate').value = targetZone.plantingDate || '';

            // Crop Preset selector
            const cropPresetSelect = document.getElementById('editCropPresetSelect');
            if (cropPresetSelect) {
                cropPresetSelect.value = targetZone.cropType || 'custom';
            }

            // Populate Thresholds in Modal
            const th = targetZone.thresholds || Config.DEFAULT_THRESHOLDS;
            document.getElementById('modalThreshTempHigh').value = th.tempHigh ?? 32;
            document.getElementById('modalThreshTempLow').value = th.tempLow ?? 22;
            document.getElementById('modalThreshHumLow').value = th.humLow ?? 50;
            document.getElementById('modalThreshHumHigh').value = th.humHigh ?? 75;
            document.getElementById('modalThreshSoilLow').value = th.soilLow ?? 40;
            document.getElementById('modalThreshSoilHigh').value = th.soilHigh ?? 70;
            document.getElementById('modalThreshLightLow').value = th.lightLow ?? 400;
            document.getElementById('modalThreshLightHigh').value = th.lightHigh ?? 1200;

            // Populate ESP32 IP input
            const ipInput = document.getElementById('cfgEsp32Ip');
            if (ipInput) {
                ipInput.value = localStorage.getItem('greenhouse_esp32_ip') || '';
            }
        }
    };

    window.GreenhouseUI = GreenhouseUI;
})(window);
