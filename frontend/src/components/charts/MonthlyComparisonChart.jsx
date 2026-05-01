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

// ─── TOOLTIP ELEGANTE DHE FIN ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-secondary/10 backdrop-blur-sm text-primary px-4 py-3 rounded-2xl shadow-xl min-w-[160px]">
        <p className="font-black text-primary/80 mb-2.5 border-b border-secondary/10 pb-1.5 uppercase tracking-wider text-[11px]">
          {label}
        </p>
        {payload.map((p, i) => (
          <div key={i} className="flex justify-between items-center gap-4 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
              <span className="text-secondary/70 font-semibold text-[12px]">{p.name}:</span>
            </div>
            <span className="font-bold text-[#1A3263] text-[12px]">
              €{Number(p.value || 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── COMPONENTI KRYESOR ─────────────────────────────────────────────────────
const MonthlyComparisonChart = ({ data }) => {
  // 1. Përpunimi i të dhënave: Shkurtimi i emrave dhe Renditja sipas vlerës (zbritës)
  const processedData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];

    return [...data]
      .map(item => ({
        ...item,
        // Shkurtojmë emrin e gjatë që të zërë më pak hapësirë
        category: item.category === "Bills & Subscriptions" ? "Bills" : item.category
      }))
      // Renditja Hibride:
      // 1. Kategoritë me shpenzime këtë muaj (nga më i larti te më i ulëti)
      // 2. Kategoritë me €0 këtë muaj, të renditura sipas muajit të kaluar (nga më i larti te më i ulëti)
      .sort((a, b) => {
        const aThis = a.thisMonth || 0;
        const bThis = b.thisMonth || 0;

        if (aThis > 0 && bThis > 0) return bThis - aThis;
        if (aThis > 0 && bThis === 0) return -1;
        if (aThis === 0 && bThis > 0) return 1;

        return (b.lastMonth || 0) - (a.lastMonth || 0);
      });
  }, [data]);

  if (processedData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-secondary/30 text-xs font-semibold">
        No comparison data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={processedData}
        margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
        barGap={8}
        barCategoryGap="20%"
      >
        {/* Rrjeta horizontale shumë e lehtë */}
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#EFD2B0"
          opacity={0.3}
          vertical={false}
        />

        <XAxis
          dataKey="category"
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          interval={0} // Detyron shfaqjen e çdo emri
          dy={10}      // Zbritje e lehtë e tekstit për hapësirë
        />

        <YAxis
          tick={{ fill: '#547792', fontSize: 10, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `€${v}`}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: '#F7F4F0', opacity: 0.5 }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={10}
          wrapperStyle={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#1A3263',
            paddingBottom: '25px',
            textTransform: 'uppercase'
          }}
        />

        {/* Shtyllat me radius të zbutur dhe ngjyrat e paletës tënde */}
        <Bar
          dataKey="thisMonth"
          name="This Month"
          fill="#1A3263"
          radius={[5, 5, 0, 0]}
        />
        <Bar
          dataKey="lastMonth"
          name="Last Month"
          fill="#FFC570"
          radius={[5, 5, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyComparisonChart;