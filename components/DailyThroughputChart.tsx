import React, { useState, useMemo } from 'react';
import type { DailySyncMetric } from '../types';

interface DailyThroughputChartProps {
    data: DailySyncMetric[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DailyThroughputChart: React.FC<DailyThroughputChartProps> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.slice(-7).map(d => ({
            ...d,
            day: WEEKDAYS[new Date(d.date + 'T00:00:00').getDay()],
        }));
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Daily Throughput (Last 7 Days)</h2>
                <p className="text-gray-500 dark:text-gray-400">No historical data available to display chart.</p>
            </div>
        );
    }
    
    const maxValue = Math.max(...chartData.map(d => d.totalRowsSynced), 1); // Avoid division by zero
    const chartHeight = 150;
    const barWidth = 30;
    const barMargin = 15;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Daily Throughput (Last 7 Days)</h2>
            <div className="relative">
                <svg
                    className="w-full"
                    viewBox={`0 0 ${chartData.length * (barWidth + barMargin)} ${chartHeight + 30}`}
                    preserveAspectRatio="xMidYMax meet"
                >
                    <g transform="translate(0, 10)">
                        {chartData.map((d, i) => {
                            const barHeight = (d.totalRowsSynced / maxValue) * chartHeight;
                            const x = i * (barWidth + barMargin) + barMargin / 2;
                            const y = chartHeight - barHeight;

                            return (
                                <g key={d.date}>
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        className="fill-current text-indigo-400 dark:text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-500 transition-colors"
                                        onMouseEnter={() => setTooltip({ x: x + barWidth / 2, y, date: d.date, value: d.totalRowsSynced })}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                    <text
                                        x={x + barWidth / 2}
                                        y={chartHeight + 20}
                                        textAnchor="middle"
                                        className="text-xs fill-current text-gray-500 dark:text-gray-400 font-medium"
                                    >
                                        {d.day}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                     <line x1="0" y1={chartHeight + 10} x2={chartData.length * (barWidth + barMargin)} y2={chartHeight + 10} className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="2" />
                </svg>
                {tooltip && (
                    <div
                        className="absolute pointer-events-none p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md shadow-lg transition-opacity duration-200"
                        style={{
                            left: `${tooltip.x}px`,
                            top: `${tooltip.y - 40}px`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <p className="font-bold">{tooltip.value.toLocaleString()} rows</p>
                        <p className="text-gray-300">{tooltip.date}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
