"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'RISING', value: 37, color: '#ef4444' },
  { name: 'GROWING', value: 156, color: '#f59e0b' },
  { name: 'STABLE', value: 892, color: '#22c55e' },
  { name: 'SLOWING', value: 132, color: '#eab308' },
  { name: 'DECLINING', value: 44, color: '#dc2626' },
  { name: 'DEAD', value: 23, color: '#9ca3af' },
];

export function StatusDonut() {
  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] h-[300px] flex flex-col">
      <h3 className="font-bold text-sm uppercase tracking-tight mb-4">VIDEOS BY STATUS</h3>
      <div className="flex-1 flex items-center">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="#000"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-2xl font-black">1,284</span>
            <span className="text-xs font-bold uppercase">TOTAL</span>
          </div>
        </div>
        <div className="w-1/2 pl-4 flex flex-col justify-center space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}</span>
              </div>
              <div className="flex gap-2">
                <span>{item.value}</span>
                <span className="text-gray-500 font-medium">({((item.value / 1284) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
