'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function OpenRateChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full text-xs font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E9EC" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#E8E9EC"
            tick={{ fill: '#8D909C' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis
            stroke="#E8E9EC"
            tick={{ fill: '#8D909C' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E9EC',
              borderRadius: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#0C0D10',
              boxShadow: '0 4px 20px rgba(0,0,0,.08)'
            }}
            itemStyle={{ color: '#1297FD' }}
            labelStyle={{ color: '#8D909C', marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#1297FD"
            strokeWidth={2.5}
            dot={{ fill: '#FFFFFF', stroke: '#1297FD', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#1297FD' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
