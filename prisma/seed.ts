import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Einnahmen-Kategorien
  const incomeCategories = [
    { name: 'Ticketverkauf', type: CategoryType.income },
    { name: 'Sponsoring', type: CategoryType.income },
    { name: 'Auftritte', type: CategoryType.income },
    { name: 'Kurseinnahmen', type: CategoryType.income },
    { name: 'Workshopeinnahmen', type: CategoryType.income },
    { name: 'Vermietungen', type: CategoryType.income },
  ]

  // Ausgaben-Kategorien
  const expenseCategories = [
    { name: 'Miete', type: CategoryType.expense },
    { name: 'Gagen', type: CategoryType.expense },
    { name: 'Marketing', type: CategoryType.expense },
    { name: 'Technik', type: CategoryType.expense },
    { name: 'Reisekosten', type: CategoryType.expense },
    { name: 'Heizkosten', type: CategoryType.expense },
    { name: 'Deko', type: CategoryType.expense },
    { name: 'Raum', type: CategoryType.expense },
  ]

  // Einnahmen-Kategorien erstellen
  console.log('📥 Creating income categories...')
  for (const category of incomeCategories) {
    const created = await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    })
    console.log(`  ✓ ${created.name} (${created.type})`)
  }

  // Ausgaben-Kategorien erstellen
  console.log('📤 Creating expense categories...')
  for (const category of expenseCategories) {
    const created = await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    })
    console.log(`  ✓ ${created.name} (${created.type})`)
  }

  console.log('✅ Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
