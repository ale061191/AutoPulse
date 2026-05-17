interface VentasChartProps {
  data: { mes: string; total: number }[]
}

export function VentasChart({ data }: VentasChartProps) {
  const max = Math.max(...data.map(d => d.total), 1)

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Ventas últimos 12 meses</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map(d => (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-[#9C5F43] rounded-t transition-all"
              style={{ height: `${(d.total / max) * 100}%` }}
            />
            <span className="text-[10px] text-gray-500">{d.mes}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
