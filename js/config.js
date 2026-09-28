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
            chartLabel: 'Độ Ẩm Không Khí (%)',
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
    }),

    // Preset Library of Crops for Smart Greenhouse Cultivation
    CROP_PRESETS: Object.freeze({
        vegetable: {
            id: 'vegetable',
            name: 'Rau Xà Lách & Cải Xoăn Thủy Canh',
            icon: '🥬',
            stage: 'Phát triển thân lá',
            thresholds: { tempHigh: 32, tempLow: 22, humLow: 50, humHigh: 75, soilLow: 40, soilHigh: 70, lightLow: 400, lightHigh: 1200, waterLow: 10, gasHigh: 400 }
        },
        melon: {
            id: 'melon',
            name: 'Dưa Lưới Fuji Nhật Bản',
            icon: '🍈',
            stage: 'Đơm hoa kết trái',
            thresholds: { tempHigh: 34, tempLow: 24, humLow: 40, humHigh: 65, soilLow: 35, soilHigh: 65, lightLow: 600, lightHigh: 1500, waterLow: 10, gasHigh: 400 }
        },
        strawberry: {
            id: 'strawberry',
            name: 'Dâu Tây Đà Lạt',
            icon: '🍓',
            stage: 'Chín quả mọng',
            thresholds: { tempHigh: 28, tempLow: 18, humLow: 55, humHigh: 75, soilLow: 45, soilHigh: 70, lightLow: 500, lightHigh: 1300, waterLow: 12, gasHigh: 400 }
        },
        tomato: {
            id: 'tomato',
            name: 'Cà Chua Bi Cherry',
            icon: '🍅',
            stage: 'Nuôi trái & đơm quả',
            thresholds: { tempHigh: 30, tempLow: 22, humLow: 50, humHigh: 70, soilLow: 40, soilHigh: 65, lightLow: 600, lightHigh: 1400, waterLow: 10, gasHigh: 400 }
        },
        mushroom: {
            id: 'mushroom',
            name: 'Nấm Bào Ngư / Nấm Mối',
            icon: '🍄',
            stage: 'Ra tai nấm',
            thresholds: { tempHigh: 28, tempLow: 22, humLow: 75, humHigh: 92, soilLow: 60, soilHigh: 85, lightLow: 50, lightHigh: 300, waterLow: 15, gasHigh: 350 }
        },
        orchid: {
            id: 'orchid',
            name: 'Hoa Lan Hồ Điệp',
            icon: '🌸',
            stage: 'Dưỡng hoa nở',
            thresholds: { tempHigh: 29, tempLow: 20, humLow: 65, humHigh: 80, soilLow: 40, soilHigh: 60, lightLow: 300, lightHigh: 800, waterLow: 10, gasHigh: 400 }
        },
        nursery: {
            id: 'nursery',
            name: 'Vườn Ươm Hạt & Cây Con',
            icon: '🌱',
            stage: 'Nảy mầm & dưỡng mầm',
            thresholds: { tempHigh: 28, tempLow: 22, humLow: 60, humHigh: 85, soilLow: 55, soilHigh: 85, lightLow: 300, lightHigh: 800, waterLow: 15, gasHigh: 350 }
        }
    }),

    // Default Configured Zones
    DEFAULT_ZONES: Object.freeze([
        {
            id: 'zone-a',
            name: 'Khu A',
            cropName: 'Rau Xà Lách Thủy Canh',
            cropType: 'vegetable',
            cropIcon: '🥬',
            stage: 'Phát triển thân lá',
            plantingDate: '15/09/2026',
            thresholds: { tempHigh: 32, tempLow: 22, humLow: 50, humHigh: 75, soilLow: 40, soilHigh: 70, lightLow: 400, lightHigh: 1200, waterLow: 10, gasHigh: 400 }
        },
        {
            id: 'zone-b',
            name: 'Khu B',
            cropName: 'Dưa Lưới Fuji',
            cropType: 'melon',
            cropIcon: '🍈',
            stage: 'Đơm hoa kết trái',
            plantingDate: '01/09/2026',
            thresholds: { tempHigh: 34, tempLow: 24, humLow: 40, humHigh: 65, soilLow: 35, soilHigh: 65, lightLow: 600, lightHigh: 1500, waterLow: 10, gasHigh: 400 }
        },
        {
            id: 'zone-c',
            name: 'Khu C',
            cropName: 'Vườn Ươm Cây Giống',
            cropType: 'nursery',
            cropIcon: '🌱',
            stage: 'Nảy mầm & Cây non',
            plantingDate: '20/09/2026',
            thresholds: { tempHigh: 28, tempLow: 22, humLow: 60, humHigh: 85, soilLow: 55, soilHigh: 85, lightLow: 300, lightHigh: 800, waterLow: 15, gasHigh: 350 }
        }
    ])
});
