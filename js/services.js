/**
 * ====================================================================
 * Nhà Kính Thông Minh - Backend Services & Simulation Engine
 * Clean Code Principle: Service Layer Decoupled from Presentation Logic
 * ====================================================================
 */

'use strict';

(function(window) {
    const Config = window.GreenhouseConfig;
    const State = window.GreenhouseState;

    // Helper: Clamp number between min and max
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Simulation Engine: generates realistic fluctuating sensor data
     * when ESP32 hardware is not connected.
     */
    function runSimulation() {
        const t = Date.now() / 1000;

        const simulated = {
            temp: clamp(26 + 7 * Math.sin(t * 0.02) + (Math.random() - 0.5) * 1.5, 0, 50),
            humidity: clamp(62 + 14 * Math.sin(t * 0.015 + 1) + (Math.random() - 0.5) * 2.5, 0, 100),
            soil: clamp(48 + 18 * Math.sin(t * 0.01 + 2) + (Math.random() - 0.5) * 3, 0, 100),
            light: clamp(520 + 380 * Math.sin(t * 0.008 + 3) + (Math.random() - 0.5) * 40, 0, 65535),
            water: clamp(65 + 20 * Math.sin(t * 0.005 + 4) + (Math.random() - 0.5) * 2, 0, 100),
            gas: clamp(120 + 40 * Math.sin(t * 0.025 + 5) + (Math.random() - 0.5) * 15, 0, 10000)
        };

        State.updateSensors(simulated);

        // Automated threshold logic simulation
        if (State.modes.fan === 'auto') {
            State.setDeviceState('fan', State.sensors.temp >= State.thresholds.tempHigh);
        }
        if (State.modes.pump === 'auto') {
            State.setDeviceState('pump', State.sensors.soil <= State.thresholds.soilLow);
        }
        if (State.modes.led === 'auto') {
            State.setDeviceState('led', State.sensors.light <= State.thresholds.lightLow);
        }
        if (State.modes.buzzer === 'auto') {
            const isDanger = State.sensors.gas >= State.thresholds.gasHigh || State.sensors.water <= State.thresholds.waterLow;
            State.setDeviceState('buzzer', isDanger);
        }
    }

    /**
     * Fetch with timeout support
     * @param {string} url
     * @param {number} timeoutMs
     */
    async function fetchWithTimeout(url, timeoutMs = Config.REQUEST_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            throw error;
        }
    }

    const GreenhouseService = {
        /**
         * Query real-time telemetry from ESP32
         */
        async fetchTelemetry() {
            try {
                const response = await fetchWithTimeout(`${Config.API_BASE}/sensors`);
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                const data = await response.json();

                State.setConnected(true);

                State.updateSensors({
                    temp: data.temperature ?? data.temp ?? 0,
                    humidity: data.humidity ?? 0,
                    soil: data.soilMoisture ?? data.soil ?? 0,
                    light: data.light ?? data.lux ?? 0,
                    water: data.waterLevel ?? data.water ?? 0,
                    gas: data.gas ?? data.mq2 ?? 0
                });

                if (data.devices) {
                    Object.keys(data.devices).forEach(key => {
                        State.setDeviceState(key, Boolean(data.devices[key]));
                    });
                }

                if (data.modes) {
                    Object.keys(data.modes).forEach(key => {
                        State.setDeviceMode(key, data.modes[key]);
                    });
                }

                if (data.thresholds) {
                    State.updateThresholds(data.thresholds);
                }

                return true;
            } catch (err) {
                // Connection failed -> Graceful fallback to simulation
                State.setConnected(false);
                runSimulation();
                return false;
            }
        },

        /**
         * Dispatch relay control command to ESP32
         * @param {string} deviceId
         * @param {boolean} state
         */
        async setDeviceRelay(deviceId, state) {
            try {
                await fetchWithTimeout(`${Config.API_BASE}/control?device=${deviceId}&state=${state ? 1 : 0}`);
            } catch (err) {
                console.warn(`[API] Control device failed (${deviceId}), applied locally:`, err);
            }
            State.setDeviceState(deviceId, state);
        },

        /**
         * Dispatch mode toggle command (auto vs manual)
         * @param {string} deviceId
         * @param {string} mode ('auto' | 'manual')
         */
        async setDeviceMode(deviceId, mode) {
            try {
                await fetchWithTimeout(`${Config.API_BASE}/mode?device=${deviceId}&mode=${mode}`);
            } catch (err) {
                console.warn(`[API] Set mode failed (${deviceId}), applied locally:`, err);
            }
            State.setDeviceMode(deviceId, mode);
        },

        /**
         * Save configured thresholds to ESP32 EEPROM/Memory
         * @param {Object} thresholdObj
         */
        async saveThresholds(thresholdObj) {
            const queryParams = Object.keys(thresholdObj)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(thresholdObj[key])}`)
                .join('&');

            try {
                await fetchWithTimeout(`${Config.API_BASE}/threshold?${queryParams}`);
            } catch (err) {
                console.warn('[API] Save threshold failed, updated locally:', err);
            }
            State.updateThresholds(thresholdObj);
        }
    };

    window.GreenhouseService = GreenhouseService;
})(window);
