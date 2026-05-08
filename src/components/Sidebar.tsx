'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const active = (path: string) =>
    pathname === path
      ? 'bg-[#1e3a5f] text-blue-400 font-semibold'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'

  return (
    <aside className="w-[220px] min-w-[220px] bg-[#0f172a] flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-white font-bold text-[17px] tracking-tight">Shivook CRM</div>
        <div className="text-slate-500 text-[11px] mt-0.5">Sales Call Intelligence</div>
      </div>
      <nav className="p-2.5 flex-1">
        <p className="text-[10.5px] font-semibold text-slate-600 uppercase tracking-widest px-3 pt-3 pb-1.5">Main</p>
        <Link href="/" className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 ${active('/')}`}>
          <span>⚡</span> Dashboard
        </Link>
        <p className="text-[10.5px] font-semibold text-slate-600 uppercase tracking-widest px-3 pt-4 pb-1.5">System</p>
        <Link href="/settings" className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 ${active('/settings')}`}>
          <span>⚙️</span> Settings
        </Link>
      </nav>
      <div className="p-2.5 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-[30px] h-[30px] bg-[#1e3a5f] rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">JE</div>
          <div>
            <div className="text-[13px] text-slate-200 font-medium">Jacob Elbaum</div>
            <div className="text-[11px] text-slate-500">jacob@shivook.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
