"use client"

import { 
  ShieldCheck, ChevronDown, Clock, RefreshCw, CheckCircle2, 
  PlaySquare, Database, Wifi, Monitor, Lock, Mail, HardDrive, Cpu, AlertCircle, Info, Calendar, Globe, Server, Info as InfoIcon, ArrowUpToLine
} from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts'
import React from "react"

const Sparkline = ({ color }: { color: string }) => {
  const points = [7, 12, 8, 14, 9, 11, 10]
  const max = Math.max(...points)
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * 100} ${20 - (p / max) * 15}`).join(' ')
  
  return (
    <div className="w-20 h-5">
      <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
        <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" />
        {points.map((p, i) => (
          <circle key={i} cx={(i / (points.length - 1)) * 100} cy={20 - (p / max) * 15} r="1.5" fill={color} />
        ))}
      </svg>
    </div>
  )
}

export default function SystemStatusPage() {

  const lineData = [
    { name: 'May 21', rt: 120, tp: 2.1, err: 0.015 },
    { name: 'May 22', rt: 135, tp: 2.3, err: 0.018 },
    { name: 'May 23', rt: 110, tp: 2.5, err: 0.012 },
    { name: 'May 24', rt: 145, tp: 2.2, err: 0.019 },
    { name: 'May 25', rt: 125, tp: 2.6, err: 0.014 },
    { name: 'May 26', rt: 140, tp: 2.4, err: 0.017 },
    { name: 'May 27', rt: 130, tp: 2.8, err: 0.013 },
  ];

  const donutData = [
    { name: 'Healthy', value: 99.98, color: '#16a34a' },
    { name: 'Unhealthy', value: 0.02, color: '#e5e7eb' },
  ];

  const services = [
    { id: 1, name: "YouTube Data API", desc: "Data & Analytics", icon: PlaySquare, color: "text-red-600", uptime: "99.99%", rt: "128 ms", info: "API untuk mengambil data YouTube" },
    { id: 2, name: "Data Processing Engine", desc: "Pemrosesan data analytics", icon: Cpu, color: "text-gray-800", uptime: "99.97%", rt: "245 ms", info: "Mesin pemrosesan data & metrik" },
    { id: 3, name: "Real-time Data Stream", desc: "Streaming data real-time", icon: Wifi, color: "text-gray-800", uptime: "99.98%", rt: "186 ms", info: "Stream data real-time analytics" },
    { id: 4, name: "Database Cluster", desc: "Penyimpanan data", icon: Database, color: "text-gray-800", uptime: "99.99%", rt: "92 ms", info: "Cluster database utama" },
    { id: 5, name: "Web Application", desc: "Aplikasi web & dashboard", icon: Monitor, color: "text-gray-800", uptime: "99.95%", rt: "156 ms", info: "Frontend aplikasi dashboard" },
    { id: 6, name: "Authentication Service", desc: "Login & keamanan akun", icon: Lock, color: "text-gray-800", uptime: "99.99%", rt: "88 ms", info: "Layanan autentikasi & otorisasi" },
    { id: 7, name: "Notification Service", desc: "Email, push & alert", icon: Mail, color: "text-gray-800", uptime: "99.94%", rt: "312 ms", info: "Layanan notifikasi & alert" },
    { id: 8, name: "File Storage", desc: "Penyimpanan file & export", icon: HardDrive, color: "text-gray-800", uptime: "99.96%", rt: "210 ms", info: "Penyimpanan file & export data" },
    { id: 9, name: "Background Jobs", desc: "Scheduler & task processing", icon: RefreshCw, color: "text-gray-800", uptime: "99.91%", rt: "178 ms", info: "Job background & task scheduler" },
  ]

  const getStatusColor = (day: number, sid: number) => {
    // Generate a mostly green matrix with occasional minor issues
    if (sid === 9 && day === 3) return "bg-red-600";
    if (sid === 2 && day === 1) return "bg-yellow-500";
    if (sid === 7 && day === 5) return "bg-orange-500";
    return "bg-green-600";
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase mb-1 flex items-center gap-2">
              SYSTEM STATUS
            </h1>
            <p className="text-gray-600 font-bold text-sm">Pantau status sistem, layanan, dan performa platform secara real-time</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="border-2 border-black flex items-center px-3 py-1.5 font-bold text-xs bg-white shadow-[2px_2px_0_0_#000]">
            <Clock className="w-3 h-3 mr-2" /> MAY 21 - MAY 27, 2024 <ChevronDown className="w-3 h-3 ml-3" />
          </div>
          <div className="border-2 border-black flex items-center px-3 py-1.5 font-bold text-xs bg-white shadow-[2px_2px_0_0_#000]">
            Last 7 Days <ChevronDown className="w-3 h-3 ml-3" />
          </div>
          <button className="bg-white text-green-700 font-black px-4 py-1.5 border-2 border-black flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-[2px_2px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none text-xs uppercase">
            <RefreshCw className="w-4 h-4" /> REFRESH STATUS
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] flex justify-between items-center">
         <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center border-2 border-black shrink-0">
             <CheckCircle2 className="w-8 h-8 text-white" />
           </div>
           <div>
             <h2 className="text-xl font-black tracking-tighter mb-0.5">All Systems Operational</h2>
             <p className="text-gray-600 font-bold text-xs">Semua sistem berfungsi normal.</p>
           </div>
         </div>
         <div className="text-right">
           <div className="text-green-700 font-black text-lg">Uptime 99.98%</div>
           <div className="text-[10px] font-bold text-gray-500 flex items-center justify-end gap-1.5 mt-1">
             Last updated: 2 min ago <div className="w-2 h-2 rounded-full bg-green-600 border border-black"></div>
           </div>
         </div>
      </div>

      {/* Main Layout (Left: 75%, Right: 25%) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Left Side (Main Content) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
          
          {/* Row 1: Service Status */}
          <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col">
             <div className="p-4 border-b-2 border-black">
               <h3 className="font-bold text-[11px] uppercase tracking-tight">SERVICE STATUS</h3>
               <p className="text-[9px] font-medium text-gray-500 mt-1">Status layanan dan komponen sistem</p>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b-2 border-black text-[7px] uppercase font-black tracking-wider text-black bg-gray-50 whitespace-nowrap">
                     <th className="p-3 pl-4">SERVICE / COMPONENT</th>
                     <th className="p-3 w-28">STATUS</th>
                     <th className="p-3 w-20 text-center">UPTIME (7D)</th>
                     <th className="p-3 w-24 text-center">RESPONSE TIME</th>
                     <th className="p-3 w-28 text-center">TREND (7D)</th>
                     <th className="p-3">DESCRIPTION</th>
                     <th className="p-3 w-10"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {services.map((srv) => (
                     <tr key={srv.id} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors last:border-b-2 last:border-black text-[9px] font-bold">
                       <td className="p-3 pl-4">
                         <div className="flex gap-3 items-center">
                            <srv.icon className={`w-4 h-4 shrink-0 ${srv.color}`} />
                            <div>
                               <div className="leading-tight">{srv.name}</div>
                               <div className="text-[7px] text-gray-500 font-medium">{srv.desc}</div>
                            </div>
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="flex items-center gap-1.5 text-green-700">
                           <CheckCircle2 className="w-3 h-3" /> Operational
                         </div>
                       </td>
                       <td className="p-3 text-center">{srv.uptime}</td>
                       <td className="p-3 text-center">{srv.rt}</td>
                       <td className="p-3 flex justify-center"><Sparkline color="#16a34a" /></td>
                       <td className="p-3 text-[8px] text-gray-600 font-medium truncate max-w-[200px]">{srv.info}</td>
                       <td className="p-3 text-center"><ChevronDown className="w-3 h-3 text-gray-400 mx-auto cursor-pointer" /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <div className="p-3 text-[8px] font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50">
               <Info className="w-3 h-3" /> Semua waktu dalam WIB (GMT+07:00)
             </div>
          </div>

          {/* Row 2: Performance & History */}
          <div className="flex flex-col lg:flex-row gap-6">
             
             {/* System Performance */}
             <div className="flex-1 bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col">
               <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">SYSTEM PERFORMANCE <span className="text-gray-500">(7 DAYS)</span></h3>
               <p className="text-[9px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Performa sistem secara keseluruhan</p>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                 <div className="border border-gray-200 p-2 flex flex-col">
                   <span className="text-[8px] font-bold mb-1">Avg Response Time</span>
                   <div className="flex items-end gap-1.5 mt-auto">
                     <span className="text-sm font-black leading-none">164 ms</span>
                     <span className="text-[7px] text-green-600 flex items-center font-bold mb-0.5"><ArrowUpToLine className="w-2 h-2 rotate-180" /> 12.4%</span>
                   </div>
                 </div>
                 <div className="border border-gray-200 p-2 flex flex-col">
                   <span className="text-[8px] font-bold mb-1">Throughput</span>
                   <div className="flex items-end gap-1.5 mt-auto">
                     <div className="flex flex-col leading-none">
                       <span className="text-sm font-black">2.45M</span>
                       <span className="text-[6px] text-gray-500">requests/hour</span>
                     </div>
                     <span className="text-[7px] text-green-600 flex items-center font-bold mb-0.5"><ArrowUpToLine className="w-2 h-2" /> 8.7%</span>
                   </div>
                 </div>
                 <div className="border border-gray-200 p-2 flex flex-col">
                   <span className="text-[8px] font-bold mb-1">Error Rate</span>
                   <div className="flex items-end gap-1.5 mt-auto">
                     <span className="text-sm font-black leading-none">0.02%</span>
                     <span className="text-[7px] text-green-600 flex items-center font-bold mb-0.5"><ArrowUpToLine className="w-2 h-2 rotate-180" /> 62.5%</span>
                   </div>
                 </div>
                 <div className="border border-gray-200 p-2 flex flex-col">
                   <span className="text-[8px] font-bold mb-1">Availability</span>
                   <div className="flex items-end gap-1.5 mt-auto">
                     <span className="text-sm font-black leading-none">99.98%</span>
                     <span className="text-[7px] text-green-600 flex items-center font-bold mb-0.5"><ArrowUpToLine className="w-2 h-2" /> 0.01%</span>
                   </div>
                 </div>
               </div>

               <div className="flex gap-4 text-[8px] font-bold mb-4 justify-center">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600 border border-black"></div> Response Time (ms)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-600 border border-black"></div> Throughput (req/hour)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500 border border-black"></div> Error Rate (%)</span>
               </div>
               
               <div className="flex-1 w-full min-h-[160px] text-[7px] font-bold">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#000' }} dy={5} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#000' }} tickFormatter={(v)=>`${v} ms`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#000' }} tickFormatter={(v)=>`${v}M`} />
                      <Tooltip contentStyle={{ border: '2px solid black', borderRadius: '0', boxShadow: '2px 2px 0 0 #000', fontWeight: 'bold' }} />
                      <Line yAxisId="left" type="monotone" dataKey="rt" stroke="#2563eb" strokeWidth={2} dot={{ stroke: '#2563eb', strokeWidth: 1.5, fill: '#fff', r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="tp" stroke="#16a34a" strokeWidth={2} dot={{ stroke: '#16a34a', strokeWidth: 1.5, fill: '#fff', r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="err" stroke="#f97316" strokeWidth={2} dot={{ stroke: '#f97316', strokeWidth: 1.5, fill: '#fff', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="text-right mt-2 border-t-2 border-black pt-2">
                 <a href="#" className="text-[8px] font-bold underline text-blue-600 uppercase">VIEW DETAILED METRICS</a>
               </div>
             </div>

             {/* Status History */}
             <div className="flex-1 bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col relative overflow-hidden">
               <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">STATUS HISTORY <span className="text-gray-500">(7 DAYS)</span></h3>
               <p className="text-[9px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Riwayat status sistem</p>
               
               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[7px] font-bold text-gray-500 pb-2">
                       <th className="font-normal w-32 pb-2"></th>
                       {['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'].map(d => <th key={d} className="text-center font-normal pb-2">{d}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {services.map((srv, i) => (
                       <tr key={srv.id} className="text-[7.5px] font-bold h-7">
                         <td className="truncate max-w-[120px]">{srv.name}</td>
                         {[1,2,3,4,5,6,7].map(day => (
                           <td key={day} className="text-center">
                             <div className={`w-2.5 h-2.5 rounded-full mx-auto border border-black shadow-[1px_1px_0_0_#000] ${getStatusColor(day, srv.id)}`}></div>
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               <div className="flex gap-4 justify-center items-center mt-4 border-t-2 border-black pt-4 text-[7px] font-bold flex-wrap">
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-600 border border-black shadow-[1px_1px_0_0_#000]"></div> Operational</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-black shadow-[1px_1px_0_0_#000]"></div> Degraded</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-black shadow-[1px_1px_0_0_#000]"></div> Partial Outage</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black shadow-[1px_1px_0_0_#000]"></div> Major Outage</span>
               </div>
               
               <div className="text-right mt-3 border-t-2 border-black pt-2">
                 <a href="#" className="text-[8px] font-bold underline text-blue-600 uppercase">VIEW FULL HISTORY</a>
               </div>
             </div>
             
          </div>

          {/* Row 3: 3 Columns Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             
             {/* System Information */}
             <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
               <h3 className="font-bold text-[11px] uppercase tracking-tight mb-4 border-b-2 border-black pb-2">SYSTEM INFORMATION</h3>
               <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[9px]">
                  <div className="flex gap-2">
                    <Server className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Environment</div>
                      <div className="font-black">Production</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Server Time</div>
                      <div className="font-black">May 27, 2024 10:24:35 WIB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Globe className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Region</div>
                      <div className="font-black">Asia Pacific (Singapore)</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Uptime</div>
                      <div className="font-black">15d 7h 24m 12s</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <InfoIcon className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Version</div>
                      <div className="font-black">v2.4.1</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Monitor className="w-4 h-4 shrink-0 text-black mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-500">Monitoring</div>
                      <div className="font-black">24/7 Active</div>
                    </div>
                  </div>
               </div>
             </div>

             {/* Dependency Status */}
             <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col">
               <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">DEPENDENCY STATUS</h3>
               <p className="text-[8px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Status layanan pihak ketiga</p>
               <div className="space-y-3.5 text-[9px] font-bold flex-1">
                 {[
                   { name: "Google Cloud Platform", icon: Database },
                   { name: "Cloudflare CDN", icon: Globe },
                   { name: "SendGrid Email API", icon: Mail },
                   { name: "Sentry Error Tracking", icon: AlertCircle },
                 ].map((dep, i) => (
                   <div key={i} className="flex justify-between items-center">
                     <span className="flex items-center gap-2"><dep.icon className="w-3.5 h-3.5 text-blue-600" /> {dep.name}</span>
                     <span className="text-green-600">Operational</span>
                   </div>
                 ))}
               </div>
               <div className="text-center mt-3 border-t-2 border-black pt-3">
                 <a href="#" className="text-[8px] font-bold underline text-blue-600 uppercase">VIEW ALL DEPENDENCIES</a>
               </div>
             </div>

             {/* System Notifications */}
             <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col">
               <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">SYSTEM NOTIFICATIONS</h3>
               <p className="text-[8px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Notifikasi sistem terbaru</p>
               <div className="space-y-3.5 text-[8.5px] font-bold flex-1">
                 <div className="flex justify-between items-start gap-2">
                   <div className="flex gap-2 items-start">
                     <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                     <span>System recovered after maintenance</span>
                   </div>
                   <span className="text-gray-500 font-medium whitespace-nowrap text-[7.5px]">May 20, 2024 04:15 AM</span>
                 </div>
                 <div className="flex justify-between items-start gap-2">
                   <div className="flex gap-2 items-start">
                     <InfoIcon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                     <span>Scheduled maintenance completed</span>
                   </div>
                   <span className="text-gray-500 font-medium whitespace-nowrap text-[7.5px]">May 20, 2024 04:00 AM</span>
                 </div>
                 <div className="flex justify-between items-start gap-2">
                   <div className="flex gap-2 items-start">
                     <InfoIcon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                     <span>Database optimization scheduled</span>
                   </div>
                   <span className="text-gray-500 font-medium whitespace-nowrap text-[7.5px]">May 18, 2024 10:30 AM</span>
                 </div>
                 <div className="flex justify-between items-start gap-2">
                   <div className="flex gap-2 items-start">
                     <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                     <span>System performance improved</span>
                   </div>
                   <span className="text-gray-500 font-medium whitespace-nowrap text-[7.5px]">May 17, 2024 09:12 AM</span>
                 </div>
               </div>
               <div className="text-center mt-3 border-t-2 border-black pt-3">
                 <a href="#" className="text-[8px] font-bold underline text-blue-600 uppercase">VIEW ALL NOTIFICATIONS</a>
               </div>
             </div>

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[280px] flex flex-col gap-6 shrink-0">
          
          {/* System Health */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
            <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">SYSTEM HEALTH</h3>
            <p className="text-[8px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Ringkasan kesehatan sistem</p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={0} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black leading-none">99.98%</span>
                  <span className="text-[7px] font-bold text-gray-600">Healthy</span>
                </div>
              </div>
              <div className="space-y-2 text-[8px] font-bold flex-1">
                 <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-600 border border-black"></div> Operational</span> <span>9</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500 border border-black"></div> Degraded</span> <span>0</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 border border-black"></div> Partial Outage</span> <span>0</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-600 border border-black"></div> Major Outage</span> <span>0</span></div>
              </div>
            </div>
            
            <div className="space-y-2 text-[9px] font-bold mb-5 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-gray-600"><span>Total Services</span> <span className="text-black">9</span></div>
              <div className="flex justify-between text-gray-600"><span>Operational</span> <span className="text-black">9</span></div>
              <div className="flex justify-between text-gray-600"><span>Degraded</span> <span className="text-black">0</span></div>
            </div>

            <button className="w-full border-2 border-black bg-white hover:bg-gray-100 font-black py-2 uppercase shadow-[2px_2px_0_0_#000] text-[9px] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all">
               VIEW INCIDENT HISTORY
            </button>
          </div>

          {/* Active Incidents */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
            <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">ACTIVE INCIDENTS</h3>
            <p className="text-[8px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Tidak ada insiden aktif saat ini</p>
            
            <div className="border-2 border-green-600 bg-green-50 p-3 mb-4 flex items-start gap-3 shadow-[2px_2px_0_0_#16a34a]">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0 border border-black mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-[9px]">
                <div className="font-black text-green-800">Tidak ada gangguan layanan.</div>
                <div className="font-bold text-green-700 mt-0.5">Semua sistem berjalan normal.</div>
              </div>
            </div>
            
            <button className="w-full border-2 border-black bg-white hover:bg-gray-100 font-black py-2 uppercase shadow-[2px_2px_0_0_#000] text-[9px] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all">
               VIEW INCIDENT HISTORY
            </button>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
            <h3 className="font-bold text-[11px] uppercase tracking-tight mb-1">MAINTENANCE SCHEDULE</h3>
            <p className="text-[8px] font-medium text-gray-500 mb-4 border-b-2 border-black pb-2">Jadwal maintenance mendatang</p>
            
            <div className="flex gap-3 items-start mb-5">
               <div className="w-6 h-6 border-2 border-black bg-white shadow-[1px_1px_0_0_#000] flex items-center justify-center shrink-0">
                 <Calendar className="w-3.5 h-3.5" />
               </div>
               <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-[10px] leading-tight">Database Optimization</h4>
                    <span className="text-[7px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 uppercase shrink-0">Scheduled</span>
                  </div>
                  <p className="text-[7px] font-bold text-gray-500 mb-1">May 30, 2024 02:00 AM - 04:00 AM WIB</p>
                  <p className="text-[8px] font-medium text-gray-700 leading-tight">Optimasi performa database cluster</p>
               </div>
            </div>
            
            <div className="text-center mt-2 border-t border-gray-200 pt-3">
              <a href="#" className="text-[8px] font-bold underline text-blue-600 uppercase">VIEW ALL SCHEDULES</a>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
