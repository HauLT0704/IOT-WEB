/**
 * ====================================================================
 * Nhà Kính Thông Minh - Real-Time Telemetry Chart Controller
 * Clean Code Principle: Encapsulated Chart Lifecycle Manager
 * ====================================================================
 */

'use strict';

(function(window) {
    const Config = window.GreenhouseConfig;
    const State = window.GreenhouseState;

    let chartInstance = null;

    const GreenhouseChart = {
        /**
         * Initialize the Chart.js line graph
         * @param {string} canvasId
         */
        init(canvasId = 'sensorChart') {
            const canvas = document.getElementById(canvasId);
            if (!canvas || !window.Chart) return;

            const ctx = canvas.getContext('2d');
            const sensorMeta = Config.SENSORS[State.activeChartSensor];

            chartInstance = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: State.chartData.labels,
                    datasets: [{
                        label: sensorMeta.chartLabel,
                        data: State.chartData[State.activeChartSensor],
                        borderColor: sensorMeta.chartColor,
                        backgroundColor: sensorMeta.chartBg,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: sensorMeta.chartColor,
                        pointBorderColor: 'transparent',
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: sensorMeta.chartColor,
                        pointHoverBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 400 },
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#4a6a4a',
                                font: { family: 'Inter', size: 12 },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#1a2e1a',
                            bodyColor: '#4a6a4a',
                            borderColor: '#dde5dd',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 10,
                            titleFont: { family: 'Inter', weight: '600' },
                            bodyFont: { family: 'Inter' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#f0f4f0' },
                            ticks: {
                                color: '#9ab49a',
                                font: { family: 'Inter', size: 10 },
                                maxRotation: 0
                            }
                        },
                        y: {
                            grid: { color: '#f0f4f0' },
                            ticks: {
                                color: '#9ab49a',
                                font: { family: 'Inter', size: 11 }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        /**
         * Update chart with new data without full re-render
         */
        update() {
            if (!chartInstance) return;
            chartInstance.data.labels = State.chartData.labels;
            chartInstance.data.datasets[0].data = State.chartData[State.activeChartSensor];
            chartInstance.update('none');
        },

        /**
         * Switch active visualization sensor tab
         * @param {string} sensorId
         */
        switchTab(sensorId) {
            if (!Config.SENSORS[sensorId] || !chartInstance) return;

            State.setActiveChartSensor(sensorId);

            // Update Tab UI classes
            const tabs = document.querySelectorAll('.chart-tab');
            tabs.forEach(tab => {
                const targetSensor = tab.getAttribute('data-sensor');
                if (targetSensor === sensorId) {
                    tab.classList.add('chart-tab--active');
                } else {
                    tab.classList.remove('chart-tab--active');
                }
            });

            // Update Dataset visual styles and data
            const meta = Config.SENSORS[sensorId];
            const dataset = chartInstance.data.datasets[0];
            dataset.label = meta.chartLabel;
            dataset.data = State.chartData[sensorId];
            dataset.borderColor = meta.chartColor;
            dataset.backgroundColor = meta.chartBg;
            dataset.pointBackgroundColor = meta.chartColor;
            dataset.pointHoverBorderColor = meta.chartColor;

            chartInstance.update('active');
        }
    };

    window.GreenhouseChart = GreenhouseChart;
})(window);
