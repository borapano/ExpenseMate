import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value,
  } = props;
  if (!payload || !payload.name) return null;
  return (
    <g>
      {/* Deep Navy (#1A3263) për emrin e grupit */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1A3263" fontSize={13} fontWeight={700}>
        {payload.name}
      </text>
      {/* Muted Blue (#547792) për vlerën */}
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#547792" fontSize={12} fontWeight={600}>
        €{Number(value || 0).toFixed(0)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const GroupSpendingChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];

  // PALETA E RE "HIGH-CONTRAST" (E vjelë nga nuancat e tua kryesore)
  const groupPalette = [
    "#1A3263",
    "#224482",
    "#2E58A3",
    "#3B6CC5",
    "#FFC570",
    "#EFD2B0",
  ];

  if (safeData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-secondary/30 text-xs font-semibold">
        No group spending data yet
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
            // Përdorim groupPalette dhe nisim nga index 0 (ngjyra Navy)
            // Modulo (%) garanton që kodi nuk thyhet nëse ka më shumë se 6 grupe
            const fillColor = groupPalette[index % groupPalette.length];

            return (
              <Cell
                key={`cell-${index}`}
                fill={fillColor}
                stroke="none"
              />
            );
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GroupSpendingChart;