import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema für Import-Validierung
const importRowSchema = z.object({
  date: z.string().min(1, 'Datum erforderlich'),
  amount: z.string().min(1, 'Betrag erforderlich'),
  category: z.string().min(1, 'Kategorie erforderlich'),
  note: z.string().optional(),
  counterparty: z.string().optional(),
})

type ImportRow = z.infer<typeof importRowSchema>

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mapping = JSON.parse(formData.get('mapping') as string)

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // CSV-Datei lesen
    const text = await file.text()

    // CSV parsen
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Fehler beim Parsen der CSV-Datei',
          details: parseResult.errors,
        },
        { status: 400 }
      )
    }

    const rows = parseResult.data as Record<string, string>[]

    // Kategorien laden für Mapping
    const categories = await prisma.category.findMany()
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))

    const errors: Array<{ row: number; error: string }> = []
    const successCount: number[] = []

    // Rows verarbeiten
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Mapping anwenden
        const mappedData: Partial<ImportRow> = {
          date: row[mapping.date] || '',
          amount: row[mapping.amount] || '',
          category: row[mapping.category] || '',
          note: mapping.note ? row[mapping.note] : undefined,
          counterparty: mapping.counterparty ? row[mapping.counterparty] : undefined,
        }

        // Validieren
        const validated = importRowSchema.parse(mappedData)

        // Kategorie-ID finden
        const categoryId = categoryMap.get(validated.category.toLowerCase())
        if (!categoryId) {
          errors.push({
            row: i + 1,
            error: `Kategorie "${validated.category}" nicht gefunden`,
          })
          continue
        }

        // Datum parsen
        let parsedDate: Date
        try {
          parsedDate = new Date(validated.date)
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Ungültiges Datum')
          }
        } catch {
          errors.push({
            row: i + 1,
            error: `Ungültiges Datumsformat: "${validated.date}"`,
          })
          continue
        }

        // Betrag parsen
        const amount = parseFloat(validated.amount.replace(',', '.'))
        if (isNaN(amount)) {
          errors.push({
            row: i + 1,
            error: `Ungültiger Betrag: "${validated.amount}"`,
          })
          continue
        }

        // Transaktion erstellen
        await prisma.transaction.create({
          data: {
            date: parsedDate,
            amount: amount,
            categoryId: categoryId,
            note: validated.note || null,
            counterparty: validated.counterparty || null,
          },
        })

        successCount.push(i + 1)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: i + 1,
            error: error.errors.map((e) => e.message).join(', '),
          })
        } else {
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount.length,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Import-Fehler:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Import',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
