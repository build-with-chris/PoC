'use client'
import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createTransaction, type TransactionFormState } from '../actions/transactions'
import type { Category } from '@prisma/client'

const initialState: TransactionFormState = {}

export default function TransactionForm({ categories }: { categories: Category[] }) {
  const t = useTranslations('transaction')
  const tDashboard = useTranslations('dashboard')
  const [state, formAction, isPending] = useActionState(createTransaction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const incomeCategories = categories.filter((cat) => cat.type === 'income')
  const expenseCategories = categories.filter((cat) => cat.type === 'expense')

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
      // Force router refresh to reload data
      router.refresh()
    }
  }, [state.success, router])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">{tDashboard('newTransaction')}</h2>
        {state.success && <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"><p className="text-green-800 dark:text-green-200">{t('success')}</p></div>}
        {state.errors?._form && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"><p className="text-red-800 dark:text-red-200">{state.errors._form.join(', ')}</p></div>}
        <form ref={formRef} action={formAction} className="space-y-4">
          <div><label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('date')} *</label><input type="date" id="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} />{state.errors?.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.date.join(', ')}</p>}</div>
          <div><label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('amount')} *</label><input type="number" id="amount" name="amount" step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} />{state.errors?.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.amount.join(', ')}</p>}</div>
          <div><label htmlFor="categoryId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('category')} *</label><select id="categoryId" name="categoryId" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} defaultValue=""><option value="" disabled>{t('selectCategory')}</option><optgroup label={t('income')}>{incomeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup><optgroup label={t('expenses')}>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup></select>{state.errors?.categoryId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.categoryId.join(', ')}</p>}</div>
          <div><label htmlFor="counterparty" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('counterparty')}</label><input type="text" id="counterparty" name="counterparty" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} /></div>
          <div><label htmlFor="note" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('note')}</label><textarea id="note" name="note" rows={3} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} /></div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4"><label htmlFor="isAdvanced" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('isAdvanced')}</label><select id="isAdvanced" name="isAdvanced" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={isPending} defaultValue="no" onChange={(e) => { const f = document.getElementById('advancedBy') as HTMLInputElement; if(f) { f.disabled = e.target.value === 'no'; if(e.target.value === 'no') f.value = ''; }}}><option value="no">{t('no')}</option><option value="yes">{t('yes')}</option></select></div>
          <div><label htmlFor="advancedBy" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('advancedBy')}</label><input type="text" id="advancedBy" name="advancedBy" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100" disabled={true} /></div>
          <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed">{isPending ? t('saving') : t('save')}</button>
        </form>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">* {t('required')}</p>
      </div>
    </div>
  )
}
