interface UltimasVentasProps {
  ventas: { id: string; vehiculo: string; cliente: string; precio: number }[]
}

export function UltimasVentas({ ventas }: UltimasVentasProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Últimas Ventas</h3>
      <div className="space-y-2">
        {ventas.map(v => (
          <div key={v.id} className="flex justify-between items-center py-1 border-b border-[#222] last:border-0">
            <div>
              <p className="text-sm text-white">{v.vehiculo}</p>
              <p className="text-xs text-gray-400">{v.cliente}</p>
            </div>
            <span className="text-sm font-semibold text-white">
              ${v.precio.toLocaleString()}
            </span>
          </div>
        ))}
        {ventas.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No hay ventas aún</p>
        )}
      </div>
    </div>
  )
}
