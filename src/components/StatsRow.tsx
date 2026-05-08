type Stat = { label: string; value: string | number; sub: string; highlight?: boolean }

export default function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-xl border p-4 ${s.highlight ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
          <div className="text-xs text-slate-500 font-medium mb-1.5">{s.label}</div>
          <div className={`text-[26px] font-bold ${s.highlight ? 'text-blue-500' : 'text-slate-900'}`}>{s.value}</div>
          <div className="text-[11.5px] text-slate-400 mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
