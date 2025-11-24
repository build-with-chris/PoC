import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'

export default async function DebtsPage() {
  const t = await getTranslations('debts')
  const advancedTransactions = await prisma.transactions.findMany({
    where: {
      isAdvanced: true,
      isSettled: false,
    },
    include: {
      categories: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  const debtsByPerson = advancedTransactions.reduce((acc, t) => {
    const person = t.advancedBy || 'Unbekannt'
    if (!acc[person]) {
      acc[person] = []
    }
    acc[person].push(t)
    return acc
  }, {} as Record<string, typeof advancedTransactions>)

  const totalDebt = advancedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t('title')}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t('subtitle')}</p>
          </header>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{t('totalDebt')}</h2>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalDebt.toFixed(2)} €</p>
        </div>

        {Object.keys(debtsByPerson).length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <p className="text-zinc-500 dark:text-zinc-400">{t('noDebts')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(debtsByPerson).map(([person, transactions]) => {
              const personTotal = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
              return (
                <div key={person} className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{person}</h2>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{personTotal.toFixed(2)} €</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700">
                          <th className="text-left py-2 px-4 text-zinc-700 dark:text-zinc-300">{t('date')}</th>
                          <th className="text-left py-2 px-4 text-zinc-700 dark:text-zinc-300">{t('category')}</th>
                          <th className="text-left py-2 px-4 text-zinc-700 dark:text-zinc-300">{t('amount')}</th>
                          <th className="text-left py-2 px-4 text-zinc-700 dark:text-zinc-300">{t('note')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="py-2 px-4 text-zinc-900 dark:text-zinc-100">{new Date(t.date).toLocaleDateString('de-DE')}</td>
                            <td className="py-2 px-4">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                {t.categories.name}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-medium text-red-600 dark:text-red-400">{Number(t.amount).toFixed(2)} €</td>
                            <td className="py-2 px-4 text-zinc-600 dark:text-zinc-400">{t.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
  )
}
