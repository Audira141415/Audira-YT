import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  vsText: string;
}

export function KpiCard({ title, value, change, isPositive, vsText }: KpiCardProps) {
  return (
    <div className="bg-white border-4 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0_0_#000]">
      <h3 className="font-bold text-sm tracking-tight uppercase mb-2">{title}</h3>
      <div className="text-4xl font-black tracking-tighter mb-2">{value}</div>
      <div className="flex items-center gap-1 text-sm font-bold mt-auto">
        {isPositive ? (
          <span className="text-green-600 flex items-center">
            <ArrowUpRight className="w-4 h-4 mr-1" /> {change}
          </span>
        ) : (
          <span className="text-red-600 flex items-center">
            <ArrowDownRight className="w-4 h-4 mr-1" /> {change}
          </span>
        )}
        <span className="text-gray-500 font-medium text-xs ml-1">{vsText}</span>
      </div>
    </div>
  )
}
