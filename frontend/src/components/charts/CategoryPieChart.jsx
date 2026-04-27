import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from 'recharts';
import { getCategoryDetails } from '../../utils/categoryMap';

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value,
  } = props;
  // Guard: payload or name may be absent during recharts edge-case renders
  if (!payload || !payload.name) return null;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1A3263" className="text-sm" fontSize={13} fontWeight={700}>
        {payload.name.split(' ')[0]}
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

  if (safeData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-secondary/30 text-xs font-semibold">
        No category data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={safeData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onMouseEnter={(_, index) => setActiveIndex(index)}
        >
          {safeData.map((entry, index) => {
            const details = getCategoryDetails(entry.name);
            const fill = details && details.hexColor ? details.hexColor : (entry.color || '#547792');
            return (
              <Cell key={`cell-${index}`} fill={fill} stroke="none" />
            );
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;
