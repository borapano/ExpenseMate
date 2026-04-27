import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Curve,
  defs,
  linearGradient,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
        <p className="font-bold text-accent mb-0.5">{label}</p>
        <p className="font-semibold">€{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const DailyExpenseChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFC570" />
            <stop offset="100%" stopColor="#547792" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFD2B0" opacity={0.4} />
        <XAxis
          dataKey="day"
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `€${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={{ r: 3, fill: '#FFC570', stroke: '#1A3263', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#FFC570', stroke: '#1A3263', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DailyExpenseChart;
