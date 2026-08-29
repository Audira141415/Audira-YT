import { AlertTriangle, TrendingUp, ArrowDownRight, Clock, Info } from "lucide-react"

export function RecentAlerts() {
  const alerts = [
    { 
      id: 1, 
      type: "HIGH", 
      title: "Video is going VIRAL!", 
      desc: "Cozy Evening Jazz - Coffee Shop Ambience", 
      time: "2m ago",
      icon: <TrendingUp className="w-4 h-4 text-white" />,
      color: "bg-red-500"
    },
    { 
      id: 2, 
      type: "MEDIUM", 
      title: "Strong Performance Increase", 
      desc: "Relaxing Piano for Study & Focus", 
      time: "15m ago",
      icon: <ArrowDownRight className="w-4 h-4 text-white transform rotate-180" />,
      color: "bg-green-500"
    },
    { 
      id: 3, 
      type: "HIGH", 
      title: "Performance Declining", 
      desc: "Rainy Jazz Night - Smooth Jazz", 
      time: "1h ago",
      icon: <ArrowDownRight className="w-4 h-4 text-white" />,
      color: "bg-yellow-500"
    },
    { 
      id: 4, 
      type: "MEDIUM", 
      title: "API Quota Warning", 
      desc: "You have used 63% of your daily quota", 
      time: "2h ago",
      icon: <AlertTriangle className="w-4 h-4 text-black" />,
      color: "bg-yellow-400"
    },
    { 
      id: 5, 
      type: "LOW", 
      title: "Account Sync Completed", 
      desc: "Audira Jazz Lounge", 
      time: "3h ago",
      icon: <Info className="w-4 h-4 text-white" />,
      color: "bg-blue-500"
    },
  ]

  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm uppercase tracking-tight">RECENT ALERTS</h3>
        <a href="#" className="text-xs font-bold underline hover:no-underline">VIEW ALL</a>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-3">
            <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${alert.color}`}>
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{alert.title}</h4>
              <p className="text-xs font-medium text-gray-600 truncate">{alert.desc}</p>
            </div>
            <div className="text-right shrink-0 flex flex-col items-end">
              <span className="text-xs font-bold">{alert.time}</span>
              <span className={`text-[10px] font-black border-2 border-black px-1 mt-1 uppercase 
                ${alert.type === 'HIGH' ? 'text-red-600 bg-red-100' : 
                  alert.type === 'MEDIUM' ? 'text-yellow-600 bg-yellow-100' : 
                  'text-green-600 bg-green-100'}`}>
                {alert.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
