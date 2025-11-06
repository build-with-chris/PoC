'use client'
import { useTranslations } from 'next-intl'
import type { Transaction, Category } from '@prisma/client'

// Serialized version of Transaction for client components (Decimal -> number, Date -> string)
type SerializedTransaction = Omit<Transaction, 'amount' | 'date' | 'createdAt' | 'updatedAt' | 'settledAt'> & {
  amount: number
  date: string
  createdAt: string
  updatedAt: string
  settledAt: string | null
  category: Category
}

type TransactionWithCategory = Transaction & { category: Category }

export default function TransactionList({ transactions }: { transactions: SerializedTransaction[] }) {
  const t = useTranslations('dashboard')
  const tTransaction = useTranslations('transaction')

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">{t('recentTransactions')}</h2>
      {transactions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">{t('noTransactions')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{tTransaction('date')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{tTransaction('category')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{tTransaction('amount')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{tTransaction('counterparty')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{tTransaction('note')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{new Date(t.date).toLocaleDateString('de-DE')}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${t.category.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {t.category.name}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-sm font-medium ${t.category.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.category.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{t.counterparty || '-'}</td>
                  <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{t.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
