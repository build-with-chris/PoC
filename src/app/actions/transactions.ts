'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Zod-Schema für Transaktions-Validierung
const transactionSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich'),
  amount: z
    .string()
    .min(1, 'Betrag ist erforderlich')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Betrag muss eine positive Zahl sein'
    ),
  categoryId: z.string().min(1, 'Kategorie ist erforderlich'),
  counterparty: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  isAdvanced: z.string().optional().nullable(),
  advancedBy: z.string().optional().nullable(),
})

export type TransactionFormState = {
  success?: boolean
  errors?: {
    date?: string[]
    amount?: string[]
    categoryId?: string[]
    counterparty?: string[]
    note?: string[]
    _form?: string[]
  }
  message?: string
}

export async function createTransaction(
  prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  console.log('=== CREATE TRANSACTION START ===')

  // FormData extrahieren
  const data = {
    date: formData.get('date') as string,
    amount: formData.get('amount') as string,
    categoryId: formData.get('categoryId') as string,
    counterparty: formData.get('counterparty') as string,
    note: formData.get('note') as string,
    isAdvanced: formData.get('isAdvanced') as string,
    advancedBy: formData.get('advancedBy') as string,
  }

  console.log('FormData:', data)

  // Validierung mit Zod
  const validationResult = transactionSchema.safeParse(data)

  if (!validationResult.success) {
    console.log('Validation failed:', validationResult.error.flatten().fieldErrors)
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { date, amount, categoryId, counterparty, note, isAdvanced, advancedBy } = validationResult.data

  console.log('Validated data:', { date, amount, categoryId, counterparty, note, isAdvanced, advancedBy })

  try {
    // Transaktion in Datenbank speichern
    const transaction = await prisma.transactions.create({
      data: {
        id: crypto.randomUUID(),
        date: new Date(date),
        amount: parseFloat(amount),
        categoryId,
        updatedAt: new Date(),
        counterparty: counterparty || null,
        note: note || null,
        isAdvanced: isAdvanced === 'yes',
        advancedBy: isAdvanced === 'yes' ? (advancedBy || null) : null,
      },
    })

    console.log('Transaction created:', transaction.id)

    // Cache revalidieren und redirecten
    revalidatePath('/', 'page')
    console.log('Path revalidated')

    return {
      success: true,
      message: 'Transaktion erfolgreich gespeichert!',
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Transaktion:', error)
    return {
      success: false,
      errors: {
        _form: ['Es ist ein Fehler beim Speichern aufgetreten. Bitte versuche es erneut.'],
      },
    }
  }
}
