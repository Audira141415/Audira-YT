import { ArrowUpRight, ArrowDownRight, PlaySquare } from "lucide-react"

const videos = [
  {
    id: 1,
    title: "Cozy Evening Jazz ☕ Coffee Shop Ambience",
    duration: "3:45:22",
    channelName: "Audira Music",
    channelSubs: "1.24M",
    published: "May 25, 2024",
    pubAge: "2 days ago",
    views24h: "256.7K",
    views24hChange: "245.3%",
    views24hUp: true,
    viewsHr: "10.7K",
    viewsHrChange: "184.6%",
    viewsHrUp: true,
    score: 92,
    status: "RISING",
    statusColor: "text-red-600",
    statusBg: "bg-red-600"
  },
  {
    id: 2,
    title: "Relaxing Piano for Study & Focus",
    duration: "11:54:59",
    channelName: "Audira Piano",
    channelSubs: "710K",
    published: "May 24, 2024",
    pubAge: "3 days ago",
    views24h: "182.4K",
    views24hChange: "128.7%",
    views24hUp: true,
    viewsHr: "7.6K",
    viewsHrChange: "112.4%",
    viewsHrUp: true,
    score: 87,
    status: "GROWING",
    statusColor: "text-green-600",
    statusBg: "bg-green-600"
  },
  {
    id: 3,
    title: "Smooth Jazz Instrumental - Morning Vibes",
    duration: "3:02:11",
    channelName: "Audira Jazz Lounge",
    channelSubs: "532K",
    published: "May 23, 2024",
    pubAge: "4 days ago",
    views24h: "98.6K",
    views24hChange: "65.2%",
    views24hUp: true,
    viewsHr: "4.1K",
    viewsHrChange: "58.9%",
    viewsHrUp: true,
    score: 74,
    status: "STABLE",
    statusColor: "text-green-600",
    statusBg: "bg-green-600"
  },
  {
    id: 4,
    title: "Rainy Jazz Night - Smooth Jazz for Relaxing",
    duration: "2:15:33",
    channelName: "Audira Music",
    channelSubs: "1.24M",
    published: "May 20, 2024",
    pubAge: "7 days ago",
    views24h: "45.2K",
    views24hChange: "32.6%",
    views24hUp: false,
    viewsHr: "1.2K",
    viewsHrChange: "41.3%",
    viewsHrUp: false,
    score: 38,
    status: "SLOWING",
    statusColor: "text-yellow-500",
    statusBg: "bg-yellow-500"
  },
  {
    id: 5,
    title: "Old Jazz Classics - Best of 50s & 60s Jazz",
    duration: "1:01:45",
    channelName: "Audira Classic",
    channelSubs: "310K",
    published: "May 15, 2024",
    pubAge: "12 days ago",
    views24h: "12.6K",
    views24hChange: "67.8%",
    views24hUp: false,
    viewsHr: "320",
    viewsHrChange: "65.4%",
    viewsHrUp: false,
    score: 22,
    status: "DECLINING",
    statusColor: "text-red-600",
    statusBg: "bg-red-600"
  }
];

export function TopVideosTable() {
  return (
    <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col col-span-3">
      {/* Header & Tabs */}
      <div className="border-b-4 border-black p-4 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-8">
          <h3 className="font-black text-sm uppercase tracking-tight">TOP PERFORMING VIDEOS</h3>
          <div className="flex gap-4 text-xs font-bold text-gray-500">
            <button className="text-black border-b-2 border-black pb-1">RISING</button>
            <button className="hover:text-black">GROWING</button>
            <button className="hover:text-black">TRENDING</button>
            <button className="hover:text-black">NEW VIDEOS</button>
          </div>
        </div>
        <a href="#" className="text-xs font-bold underline hover:no-underline">VIEW ALL</a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-[10px] uppercase font-black tracking-wider text-gray-500 bg-gray-100">
              <th className="p-4">VIDEO</th>
              <th className="p-4">CHANNEL</th>
              <th className="p-4">PUBLISHED</th>
              <th className="p-4">VIEWS (24H)</th>
              <th className="p-4">VIEWS/HR</th>
              <th className="p-4 text-center">TREND SCORE</th>
              <th className="p-4">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((vid) => (
              <tr key={vid.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 bg-black relative shrink-0 border-2 border-black shadow-[2px_2px_0_0_#000]">
                      <div className="absolute bottom-1 right-1 bg-black text-white text-[10px] font-bold px-1">
                        {vid.duration}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight max-w-[200px]">{vid.title}</h4>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                      <PlaySquare className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">{vid.channelName}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{vid.channelSubs} subscribers</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-xs">{vid.published}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{vid.pubAge}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-sm">{vid.views24h}</div>
                  <div className={`text-[10px] font-black flex items-center ${vid.views24hUp ? 'text-green-600' : 'text-red-600'}`}>
                    {vid.views24hUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {vid.views24hChange}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-sm">{vid.viewsHr}</div>
                  <div className={`text-[10px] font-black flex items-center ${vid.viewsHrUp ? 'text-green-600' : 'text-red-600'}`}>
                    {vid.viewsHrUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {vid.viewsHrChange}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0_0_#000]
                      ${vid.score >= 80 ? 'text-red-600' : vid.score >= 60 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {vid.score}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className={`flex items-center gap-1.5 font-black text-xs ${vid.statusColor}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${vid.statusBg}`}></div>
                    {vid.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
