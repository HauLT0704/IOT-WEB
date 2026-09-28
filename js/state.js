/**
 * ====================================================================
 * Nhà Kính Thông Minh - Application State Management Store
 * Clean Code Principle: Observable Centralized State Store
 * ====================================================================
 */

'use strict';

(function(window) {
    const Config = window.GreenhouseConfig;

    class GreenhouseStateStore {
        constructor() {
            this.isConnected = false;

            this.sensors = {
                temp: 0,
                humidity: 0,
                soil: 0,
                light: 0,
                water: 0,
                gas: 0
            };

            this.devices = {
                pump: false,
                fan: false,
                led: false,
                buzzer: false
            };

            this.modes = {
                pump: 'auto',
                fan: 'auto',
                led: 'auto',
                buzzer: 'auto'
            };

            this.thresholds = Object.assign({}, Config.DEFAULT_THRESHOLDS);

            this.chartData = {
                labels: [],
                temp: [],
                humidity: [],
                soil: [],
                light: [],
                water: [],
                gas: []
            };

            this.activeChartSensor = 'temp';
            this.listeners = [];
        }

        /**
         * Subscribe to state change notifications
         * @param {Function} callback
         */
        subscribe(callback) {
            if (typeof callback === 'function') {
                this.listeners.push(callback);
            }
        }

        /**
         * Notify all registered subscribers
         * @param {string} changeType - Category of change ('sensors', 'devices', 'modes', 'thresholds', 'connection')
         */
        notify(changeType) {
            for (let i = 0; i < this.listeners.length; i++) {
                try {
                    this.listeners[i](this, changeType);
                } catch (err) {
                    console.error('GreenhouseStateStore subscriber error:', err);
                }
            }
        }

        /**
         * Set connection status
         * @param {boolean} connected
         */
        setConnected(connected) {
            if (this.isConnected !== connected) {
                this.isConnected = connected;
                this.notify('connection');
            }
        }

        /**
         * Update real-time sensor readings
         * @param {Object} readings
         */
        updateSensors(readings) {
            Object.assign(this.sensors, readings);
            this.notify('sensors');
        }

        /**
         * Update specific device state
         * @param {string} deviceId
         * @param {boolean} state
         */
        setDeviceState(deviceId, state) {
            if (this.devices.hasOwnProperty(deviceId)) {
                this.devices[deviceId] = Boolean(state);
                this.notify('devices');
            }
        }

        /**
         * Update specific device mode
         * @param {string} deviceId
         * @param {string} mode ('auto' | 'manual')
         */
        setDeviceMode(deviceId, mode) {
            if (this.modes.hasOwnProperty(deviceId)) {
                this.modes[deviceId] = mode === 'manual' ? 'manual' : 'auto';
                this.notify('modes');
            }
        }

        /**
         * Update threshold limits
         * @param {Object} newThresholds
         */
        updateThresholds(newThresholds) {
            Object.assign(this.thresholds, newThresholds);
            this.notify('thresholds');
        }

        /**
         * Push a new historical reading point to chart data
         * @param {string} timeLabel
         */
        pushChartReading(timeLabel) {
            this.chartData.labels.push(timeLabel);
            this.chartData.temp.push(+this.sensors.temp.toFixed(1));
            this.chartData.humidity.push(+this.sensors.humidity.toFixed(1));
            this.chartData.soil.push(+this.sensors.soil.toFixed(0));
            this.chartData.light.push(+this.sensors.light.toFixed(0));
            this.chartData.water.push(+this.sensors.water.toFixed(0));
            this.chartData.gas.push(+this.sensors.gas.toFixed(0));

            if (this.chartData.labels.length > Config.MAX_CHART_POINTS) {
                this.chartData.labels.shift();
                Object.keys(Config.SENSORS).forEach(key => {
                    if (this.chartData[key]) this.chartData[key].shift();
                });
            }
            this.notify('chart');
        }

        /**
         * Set current selected sensor for visualization chart
         * @param {string} sensorId
         */
        setActiveChartSensor(sensorId) {
            if (Config.SENSORS[sensorId]) {
                this.activeChartSensor = sensorId;
                this.notify('chartTab');
            }
        }
    }

    window.GreenhouseState = new GreenhouseStateStore();
})(window);
