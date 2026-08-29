import { ArrowUpRight, ArrowDownRight } from "lucide-react"

export function TopChannels() {
  const channels = [
    { id: 1, name: "Audira Music", subs: "1.24M", views: "2.45M", change: "16.3%", up: true },
    { id: 2, name: "Audira Jazz Lounge", subs: "532K", views: "1.12M", change: "12.7%", up: true },
    { id: 3, name: "Audira Piano", subs: "710K", views: "980K", change: "22.1%", up: true },
    { id: 4, name: "Audira Classic", subs: "310K", views: "420K", change: "5.3%", up: false },
  ]

  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm uppercase tracking-tight">TOP CHANNELS</h3>
        <a href="#" className="text-xs font-bold underline hover:no-underline">VIEW ALL</a>
      </div>
      
      <div className="space-y-4">
        {channels.map((ch, i) => (
          <div key={ch.id} className="flex items-center gap-3">
            <span className="font-black text-sm w-4">{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate">{ch.name}</h4>
              <p className="text-[10px] text-gray-600 font-medium">{ch.subs} subscribers</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-xs">{ch.views}</div>
              <div className="text-[10px] text-gray-500">Views (7D)</div>
            </div>
            <div className={`shrink-0 w-12 text-right text-xs font-black flex items-center justify-end ${ch.up ? 'text-green-600' : 'text-red-600'}`}>
              {ch.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {ch.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
