import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary text-white px-4 py-3 rounded-xl shadow-lg text-sm min-w-[140px]">
        <p className="font-bold text-accent mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill }} className="font-semibold">
            {p.name}: €{Number(p.value || 0).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyComparisonChart = ({ data }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-secondary/30 text-xs font-semibold">
        No comparison data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#EFD2B0" opacity={0.4} />
        <XAxis
          dataKey="category"
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `€${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#547792', paddingTop: '8px' }}
        />
        <Bar dataKey="thisMonth" name="This Month" fill="#1A3263" radius={[6, 6, 0, 0]} />
        <Bar dataKey="lastMonth" name="Last Month"  fill="#FFC570" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyComparisonChart;
