export function ContentOpportunity() {
  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm uppercase tracking-tight">CONTENT OPPORTUNITIES</h3>
        <a href="#" className="text-xs font-bold underline hover:no-underline">VIEW ALL</a>
      </div>
      
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-black shrink-0 border-2 border-black shadow-[2px_2px_0_0_#000]"></div>
        <div>
          <h4 className="font-bold text-sm leading-tight mb-1">Cozy Jazz + Rain + Coffee Shop</h4>
          <span className="bg-green-100 text-green-700 border-2 border-black text-[10px] font-black px-1.5 py-0.5 uppercase shadow-[2px_2px_0_0_#000]">
            HIGH OPPORTUNITY
          </span>
          <div className="flex gap-2 mt-3 text-[10px] font-bold">
            <span className="border border-black px-1.5 py-0.5">6 VIDEOS</span>
            <span className="border border-black px-1.5 py-0.5">CTR +18%</span>
            <span className="border border-black px-1.5 py-0.5">VIEWS/HR +42%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
