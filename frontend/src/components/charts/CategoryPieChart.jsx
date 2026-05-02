import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
  Cell
} from 'recharts';

const SHORT_NAMES = {
  'Food & Dining': 'Food',
  'Bills & Subscriptions': 'Bills',
  'Transportation': 'Transport',
  'Entertainment': 'Entertain',
  'Groceries': 'Groceries',
  'Housing': 'Housing',
  'Utilities': 'Utilities',
  'Shopping': 'Shopping',
  'Travel': 'Travel',
  'Health': 'Health',
  'Other': 'Other',
};

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value,
  } = props;

  if (!payload || !payload.name) return null;

  const displayName = SHORT_NAMES[payload.name] ?? payload.name;

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1A3263" className="text-sm" fontSize={13} fontWeight={700}>
        {displayName}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#547792" fontSize={12} fontWeight={600}>
        €{Number(value || 0).toFixed(0)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const CategoryPieChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];
  const chartPalette = ["#1A3263", "#224482", "#2E58A3", "#3B6CC5", "#547792", "#6B8EAB", "#82A5C4", "#9BBCCF", "#FFC570", "#FFD699", "#EFD2B0"];

  const isDataEmpty = safeData.length === 0 || safeData.every(d => (d.value || 0) === 0);
  const chartData = isDataEmpty ? [{ name: 'Empty', value: 1 }] : safeData;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          activeIndex={isDataEmpty ? -1 : activeIndex}
          activeShape={isDataEmpty ? null : renderActiveShape}
          onMouseEnter={isDataEmpty ? null : (_, index) => setActiveIndex(index)}
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={isDataEmpty ? "#E5E7EB" : chartPalette[index % chartPalette.length]}
              stroke="none"
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;