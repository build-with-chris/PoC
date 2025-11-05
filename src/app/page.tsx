import { prisma } from '@/lib/prisma'
import TransactionForm from './components/TransactionForm'
import KPICards from './components/KPICards'
import TransactionList from './components/TransactionList'
import Navbar from './components/Navbar'

export default async function Home() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const categories = await prisma.category.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  const monthTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    include: { category: true },
  })

  const revenue = monthTransactions.filter((t) => t.category.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const costs = monthTransactions.filter((t) => t.category.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const margin = revenue - costs

  const recentTransactions = await prisma.transaction.findMany({
    take: 20,
    orderBy: { date: 'desc' },
    include: { category: true },
  })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Finanz-Tracking</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Erfasse deine Einnahmen und Ausgaben</p>
          </header>
        <KPICards revenue={revenue} costs={costs} margin={margin} />
        <div className="mb-12"><TransactionForm categories={categories} /></div>
        <TransactionList transactions={recentTransactions} />
        </div>
      </div>
    </>
  )
}
