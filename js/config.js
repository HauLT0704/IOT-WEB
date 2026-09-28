/**
 * ====================================================================
 * Nhà Kính Thông Minh - Application Configuration & Constants
 * Clean Code Principle: Centralized Single Source of Truth for Config
 * ====================================================================
 */

'use strict';

window.GreenhouseConfig = Object.freeze({
    // Networking & Intervals
    API_BASE: '',
    REFRESH_INTERVAL_MS: 2000,
    REQUEST_TIMEOUT_MS: 3000,
    MAX_CHART_POINTS: 30,
    MAX_LOG_ENTRIES: 50,
    TOAST_DURATION_MS: 3000,

    // Initial Default Sensor Thresholds
    DEFAULT_THRESHOLDS: Object.freeze({
        tempHigh: 35,
        tempLow: 28,
        humLow: 10,
        humHigh: 50,
        soilLow: 30,
        soilHigh: 70,
        lightLow: 300,
        lightHigh: 1000,
        waterLow: 5,
        gasHigh: 400
    }),

    // Device Metadata (ID to display labels)
    DEVICES: Object.freeze({
        pump: { id: 'pump', name: 'Máy bơm tưới', channel: 'Relay kênh 1', icon: '💦' },
        fan: { id: 'fan', name: 'Quạt tản nhiệt', channel: 'Relay kênh 2', icon: '🌀' },
        led: { id: 'led', name: 'Đèn LED', channel: 'Relay kênh 3', icon: '💡' },
        buzzer: { id: 'buzzer', name: 'Còi cảnh báo', channel: 'Relay kênh 4', icon: '🔔' }
    }),

    // Sensor Metadata (Keys, units, maximum display ranges, charts)
    SENSORS: Object.freeze({
        temp: {
            id: 'temp',
            name: 'Nhiệt độ',
            unit: '°C',
            icon: '🌡️',
            maxDisplay: 50,
            chartLabel: 'Nhiệt Độ (°C)',
            chartColor: '#e74c3c',
            chartBg: 'rgba(231,76,60,0.08)'
        },
        humidity: {
            id: 'humidity',
            name: 'Độ ẩm không khí',
            unit: '%',
            icon: '💧',
            maxDisplay: 100,
            chartLabel: 'Độ Ẩm KK (%)',
            chartColor: '#2980b9',
            chartBg: 'rgba(41,128,185,0.08)'
        },
        soil: {
            id: 'soil',
            name: 'Độ ẩm đất',
            unit: '%',
            icon: '🌱',
            maxDisplay: 100,
            chartLabel: 'Độ Ẩm Đất (%)',
            chartColor: '#8B6914',
            chartBg: 'rgba(139,105,20,0.08)'
        },
        light: {
            id: 'light',
            name: 'Ánh sáng',
            unit: 'lux',
            icon: '☀️',
            maxDisplay: 65535,
            chartLabel: 'Ánh Sáng (lux)',
            chartColor: '#f0a500',
            chartBg: 'rgba(240,165,0,0.08)'
        },
        water: {
            id: 'water',
            name: 'Mực nước',
            unit: '%',
            icon: '🚰',
            maxDisplay: 100,
            chartLabel: 'Mực Nước (%)',
            chartColor: '#16a085',
            chartBg: 'rgba(22,160,133,0.08)'
        },
        gas: {
            id: 'gas',
            name: 'Khói / Gas',
            unit: 'ppm',
            icon: '💨',
            maxDisplay: 1000,
            chartLabel: 'Khói/Gas (ppm)',
            chartColor: '#8e44ad',
            chartBg: 'rgba(142,68,173,0.08)'
        }
    })
});
