import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  icon: string
  className?: string
}

export function KpiCard({ title, value, icon, className }: KpiCardProps) {
  return (
    <div className={cn('bg-[#1a1a1a] border border-[#333] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
