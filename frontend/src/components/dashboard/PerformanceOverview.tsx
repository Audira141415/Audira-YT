"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown } from 'lucide-react'

const data = [
  { name: 'MAY 21', views: 750, watchTime: 450, subs: 200 },
  { name: 'MAY 22', views: 950, watchTime: 550, subs: 250 },
  { name: 'MAY 23', views: 800, watchTime: 650, subs: 280 },
  { name: 'MAY 24', views: 850, watchTime: 600, subs: 210 },
  { name: 'MAY 25', views: 1000, watchTime: 700, subs: 350 },
  { name: 'MAY 26', views: 950, watchTime: 650, subs: 280 },
  { name: 'MAY 27', views: 900, watchTime: 650, subs: 300 },
];

export function PerformanceOverview() {
  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] col-span-2 h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm uppercase tracking-tight">PERFORMANCE OVERVIEW</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-black"></div> Views</span>
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-green-500"></div> Watch Time (Hours)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-blue-600"></div> Subscribers</span>
          </div>
          <button className="border-2 border-black px-2 py-1 text-xs font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
            DAILY <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full font-sans text-xs font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#000' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000' }} tickFormatter={(val) => `${val}K`} />
            <Tooltip 
              contentStyle={{ border: '4px solid black', borderRadius: '0', boxShadow: '4px 4px 0 0 #000', fontWeight: 'bold' }}
            />
            <Line type="monotone" dataKey="views" stroke="#000" strokeWidth={3} dot={{ stroke: '#000', strokeWidth: 2, fill: '#fff', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="watchTime" stroke="#22c55e" strokeWidth={3} dot={{ stroke: '#22c55e', strokeWidth: 2, fill: '#fff', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="subs" stroke="#2563eb" strokeWidth={3} dot={{ stroke: '#2563eb', strokeWidth: 2, fill: '#fff', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
