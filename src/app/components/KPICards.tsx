export default function KPICards({ revenue, costs, margin }: { revenue: number; costs: number; margin: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Umsatz</h3>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{revenue.toFixed(2)} €</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Kosten</h3>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{costs.toFixed(2)} €</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Deckungsbeitrag</h3>
        <p className={`text-3xl font-bold ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{margin.toFixed(2)} €</p>
      </div>
    </div>
  )
}
