'use client'

import { useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine, ReferenceArea, ComposedChart } from 'recharts'
// @ts-ignore - dom-to-image-more has no type definitions
import domtoimage from 'dom-to-image-more'

interface RevenueData {
  name: string
  tickets: number
  gastronomy: number // Gastronomie-Einnahmen (pro Ticket)
  dailyGastronomy: number // Tägliche Gastronomie-Einnahmen
  courses: number
  workshops: number
  rental: number
  fixedIncome: number
  funding: number
  memberships: number
  total: number
}

interface LiquidityData {
  week: number
  liquidity: number
  isMinimum?: boolean
}

interface WeeklyData {
  week: number
  revenue: number
  costs: number
  status: 'Schwach' | 'Normal' | 'Stark' | 'Ausgeschlossen' | 'Keine Einn.' | 'Keine Ausg.' | 'Vergangenheit' | 'Angepasst'
}

interface CostData {
  name: string
  value: number
  label: string
}

const COLORS = {
  tickets: '#3b82f6',
  gastronomy: '#f97316', // Orange für Gastronomie (pro Ticket)
  dailyGastronomy: '#fb923c', // Hell-Orange für tägliche Gastronomie
  courses: '#10b981',
  workshops: '#f59e0b',
  rental: '#8b5cf6',
  fixedIncome: '#ef4444',
  funding: '#06b6d4',
  memberships: '#ec4899',
}

export default function DiagramsPage() {
  const t = useTranslations('diagrams')
  const locale = useLocale()
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [liquidityData, setLiquidityData] = useState<LiquidityData[]>([])
  const [liquidityBuffer, setLiquidityBuffer] = useState<number>(10000)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [costData, setCostData] = useState<CostData[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Refs für Diagramm-Container
  const revenuePercentChartRef = useRef<HTMLDivElement>(null)
  const revenueAbsoluteChartRef = useRef<HTMLDivElement>(null)
  const liquidityChartRef = useRef<HTMLDivElement>(null)
  const revenueCostsChartRef = useRef<HTMLDivElement>(null)
  const costStructureChartRef = useRef<HTMLDivElement>(null)

  const downloadChartAsPNG = async (chartRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!chartRef.current) return

    try {
      // Warte kurz, damit alle Renderings abgeschlossen sind
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Verwende dom-to-image-more statt html2canvas
      // Diese Bibliothek hat bessere SVG-Unterstützung und kann mit modernen CSS-Farben umgehen
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: chartRef.current.offsetWidth * 2, // 2x für höhere Qualität
        height: chartRef.current.offsetHeight * 2,
        filter: (node: Node) => {
          // Filtere problematische Elemente aus
          if (node.nodeType === Node.TEXT_NODE) {
            return true
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element
            // Überspringe Script- und Style-Tags
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
              return false
            }
          }
          return true
        },
      })
      
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting chart:', error)
      setError(locale === 'de' ? 'Fehler beim Exportieren des Diagramms' : 'Error exporting chart')
    }
  }

  const parseLiquidityData = (content: string): { data: LiquidityData[], buffer: number } => {
    const liquidity: LiquidityData[] = []
    let buffer = 10000 // Default
    let minLiquidity = Infinity
    let minWeek = 0

    try {
      const lines = content.split('\n')
      
      // Suche nach Liquiditätspuffer
      for (const line of lines) {
        if (line.includes('Liquiditätspuffer') || line.includes('Liquidity Buffer')) {
          const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
          if (match) {
            buffer = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
          }
        }
      }

      // Suche nach wöchentlicher Liquiditätstabelle
      let foundTable = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Suche nach Tabellenkopf mit "Liquidität"
        if (line.includes('Liquidität') && (line.includes('KW') || line.includes('Week'))) {
          foundTable = true
          continue
        }

        if (foundTable) {
          // Parse Zeilen wie: "KW  1" oder "KW 1" gefolgt von Liquiditätswert
          // Format: KW XX | ... | Liquidität | ⚠️
          const kwMatch = line.match(/KW\s+(\d+)/i)
          if (kwMatch) {
            const weekNum = parseInt(kwMatch[1], 10)
            
            // Suche nach Liquiditätswert in der Zeile
            // Format: KW XX | Status | Einnahmen-Mult | Ausgaben-Mult | Einnahmen | Ausgaben | Gewinn/Verlust | Liquidität | ⚠️
            // Liquidität ist normalerweise der letzte Währungsbetrag vor dem ⚠️
            let liquidityValue = 0
            
            // Finde alle Währungsbeträge in der Zeile
            const allMatches = Array.from(line.matchAll(/([\d.,]+)\s*€/g))
            
            if (allMatches.length > 0) {
              // Der Liquiditätswert ist der letzte Währungsbetrag (vor dem ⚠️ falls vorhanden)
              // Normalerweise gibt es 4 Werte: Einnahmen, Ausgaben, Gewinn/Verlust, Liquidität
              const lastMatch = allMatches[allMatches.length - 1]
              liquidityValue = parseFloat(lastMatch[1].replace(/\./g, '').replace(',', '.'))
            }

            // Akzeptiere auch 0-Werte, da Liquidität negativ sein kann
            if (weekNum <= 52) {
              liquidity.push({
                week: weekNum,
                liquidity: liquidityValue,
              })

              if (liquidityValue < minLiquidity) {
                minLiquidity = liquidityValue
                minWeek = weekNum
              }
            }

            // Stoppe nach 52 Wochen
            if (weekNum >= 52) {
              break
            }
          }

          // Wenn wir zur nächsten Sektion kommen, stoppen
          if (line.includes('===') || line.includes('ZUSAMMENFASSUNG') || line.includes('SUMMARY')) {
            break
          }
        }
      }

      // Markiere Minimum
      if (minWeek > 0) {
        const minIndex = liquidity.findIndex(d => d.week === minWeek)
        if (minIndex >= 0) {
          liquidity[minIndex].isMinimum = true
        }
      }

      // Falls keine Daten gefunden wurden, versuche aus "Minimale Liquidität" zu extrahieren
      if (liquidity.length === 0) {
        for (const line of lines) {
          if (line.includes('Minimale Liquidität') || line.includes('Minimum Liquidity')) {
            const match = line.match(/([\d.,]+)\s*€/)
            if (match) {
              const minValue = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              // Erstelle eine einfache Darstellung mit Start- und Endwert
              // Wir haben nicht genug Daten für 52 Wochen, also erstellen wir eine Schätzung
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Startliquidität') || lines[i].includes('Initial Liquidity')) {
                  const startMatch = lines[i].match(/([\d.,]+)\s*€/)
                  if (startMatch) {
                    const startValue = parseFloat(startMatch[1].replace(/\./g, '').replace(',', '.'))
                    const endMatch = lines.find(l => l.includes('Liquidität am Jahresende') || l.includes('End of Year Liquidity'))
                    let endValue = startValue
                    if (endMatch) {
                      const endMatchValue = endMatch.match(/([\d.,]+)\s*€/)
                      if (endMatchValue) {
                        endValue = parseFloat(endMatchValue[1].replace(/\./g, '').replace(',', '.'))
                      }
                    }
                    
                    // Lineare Interpolation über 52 Wochen
                    const step = (endValue - startValue) / 51
                    for (let week = 1; week <= 52; week++) {
                      const value = startValue + (step * (week - 1))
                      liquidity.push({
                        week,
                        liquidity: value,
                        isMinimum: Math.abs(value - minValue) < 100, // Markiere wenn nahe am Minimum
                      })
                    }
                    break
                  }
                }
              }
            }
            break
          }
        }
      }
    } catch (err) {
      console.error('Error parsing liquidity data:', err)
    }

    return { data: liquidity, buffer }
  }

  const parseWeeklyData = (content: string): WeeklyData[] => {
    const weekly: WeeklyData[] = []

    try {
      const lines = content.split('\n')
      
      // Suche nach wöchentlicher Tabelle
      let foundTable = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Suche nach Tabellenkopf mit "Einnahmen" und "Ausgaben"
        if ((line.includes('Einnahmen') || line.includes('Revenue')) && 
            (line.includes('Ausgaben') || line.includes('Costs')) &&
            (line.includes('KW') || line.includes('Week'))) {
          foundTable = true
          continue
        }

        if (foundTable) {
          // Parse Zeilen wie: "KW XX | Status | ... | Einnahmen | Ausgaben | ..."
          const kwMatch = line.match(/KW\s+(\d+)/i)
          if (kwMatch) {
            const weekNum = parseInt(kwMatch[1], 10)
            
            // Extrahiere Status
            let status: WeeklyData['status'] = 'Normal'
            if (line.includes('Schwach') || line.includes('Weak')) {
              status = 'Schwach'
            } else if (line.includes('Stark') || line.includes('Strong')) {
              status = 'Stark'
            } else if (line.includes('Ausgeschlossen') || line.includes('Excluded')) {
              status = 'Ausgeschlossen'
            } else if (line.includes('Keine Einn.') || line.includes('No Rev.')) {
              status = 'Keine Einn.'
            } else if (line.includes('Keine Ausg.') || line.includes('No Costs')) {
              status = 'Keine Ausg.'
            } else if (line.includes('Vergangenheit') || line.includes('Historical')) {
              status = 'Vergangenheit'
            } else if (line.includes('Angepasst') || line.includes('Adjusted')) {
              status = 'Angepasst'
            }
            
            // Finde alle Währungsbeträge in der Zeile
            const allMatches = Array.from(line.matchAll(/([\d.,]+)\s*€/g))
            
            let revenue = 0
            let costs = 0
            
            // Normalerweise: Einnahmen, Ausgaben, Gewinn/Verlust, Liquidität
            // Also: Einnahmen = matches[0], Ausgaben = matches[1]
            if (allMatches.length >= 2) {
              revenue = parseFloat(allMatches[0][1].replace(/\./g, '').replace(',', '.'))
              costs = parseFloat(allMatches[1][1].replace(/\./g, '').replace(',', '.'))
            }

            if (weekNum <= 52) {
              weekly.push({
                week: weekNum,
                revenue,
                costs,
                status,
              })
            }

            // Stoppe nach 52 Wochen
            if (weekNum >= 52) {
              break
            }
          }

          // Wenn wir zur nächsten Sektion kommen, stoppen
          if (line.includes('===') || line.includes('ZUSAMMENFASSUNG') || line.includes('SUMMARY')) {
            break
          }
        }
      }
    } catch (err) {
      console.error('Error parsing weekly data:', err)
    }

    return weekly
  }

  const parseCostData = (content: string): CostData[] => {
    const costs: CostData[] = []

    try {
      const lines = content.split('\n')
      let foundCostsSection = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line.includes('KOSTEN:') || line.includes('COSTS:')) {
          foundCostsSection = true
          continue
        }

        if (foundCostsSection) {
          // Parse monatliche Kosten
          if (line.includes('Miete') || line.includes('Rent')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'rent',
                value: monthly * 12,
                label: locale === 'de' ? 'Miete' : 'Rent',
              })
            }
          }

          if (line.includes('Gehälter') || line.includes('Salaries') || line.includes('Personalkosten')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'salaries',
                value: monthly * 12,
                label: locale === 'de' ? 'Gehälter' : 'Salaries',
              })
            }
          }

          if (line.includes('Marketing')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'marketing',
                value: monthly * 12,
                label: locale === 'de' ? 'Marketing' : 'Marketing',
              })
            }
          }

          if (line.includes('Technik') || line.includes('Technology')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'technology',
                value: monthly * 12,
                label: locale === 'de' ? 'Technik' : 'Technology',
              })
            }
          }

          if (line.includes('Heizkosten') || line.includes('Heating') || line.includes('Treibstoff') || line.includes('Fuel')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'heating',
                value: monthly * 12,
                label: locale === 'de' ? 'Heizkosten/Treibstoff' : 'Heating/Fuel',
              })
            }
          }

          if (line.includes('Sonstige Kosten') || line.includes('Other Costs')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Monat/i)
            if (match) {
              const monthly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'other',
                value: monthly * 12,
                label: locale === 'de' ? 'Sonstige Kosten' : 'Other Costs',
              })
            }
          }

          if (line.includes('Wöchentliche Rücklagen') || line.includes('Weekly Reserves')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Woche/i)
            if (match) {
              const weekly = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'reserves',
                value: weekly * 52,
                label: locale === 'de' ? 'Wöchentliche Rücklagen' : 'Weekly Reserves',
              })
            }
          }

          // Jährliche Kosten
          if (line.includes('Steuerberater') || line.includes('Tax Advisor')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Jahr/i)
            if (match) {
              const annual = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'taxAdvisor',
                value: annual,
                label: locale === 'de' ? 'Steuerberater' : 'Tax Advisor',
              })
            }
          }

          if (line.includes('Jahresabschluss') || line.includes('Tax Return') || line.includes('Annual Accounts')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Jahr/i)
            if (match) {
              const annual = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'taxReturn',
                value: annual,
                label: locale === 'de' ? 'Jahresabschluss/Steuererklärung' : 'Annual Accounts/Tax Return',
              })
            }
          }

          if (line.includes('Finanzbuchhaltung') || line.includes('Financial Accounting')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Jahr/i)
            if (match) {
              const annual = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'accounting',
                value: annual,
                label: locale === 'de' ? 'Finanzbuchhaltung' : 'Financial Accounting',
              })
            }
          }

          if (line.includes('Lohnbuchhaltung') || line.includes('Payroll Accounting')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Jahr/i)
            if (match) {
              const annual = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              costs.push({
                name: 'payroll',
                value: annual,
                label: locale === 'de' ? 'Lohnbuchhaltung' : 'Payroll Accounting',
              })
            }
          }

          if (line.includes('Gesamt jährliche Buchhaltungskosten') || line.includes('Total annual accounting costs')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€\/Jahr/i)
            if (match) {
              const annual = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              // Überschreibe einzelne Buchhaltungskosten, falls vorhanden
              const existingIndex = costs.findIndex(c => c.name === 'accounting')
              if (existingIndex >= 0) {
                costs[existingIndex].value = annual
              } else {
                costs.push({
                  name: 'accounting',
                  value: annual,
                  label: locale === 'de' ? 'Buchhaltung (gesamt)' : 'Accounting (total)',
                })
              }
            }
          }

          // Wenn wir zur nächsten Sektion kommen, stoppen
          if (line.includes('KENNZAHLEN') || line.includes('METRICS') || line.includes('===')) {
            break
          }
        }
      }

      // Sortiere nach Wert und nimm Top-5
      const sorted = costs.sort((a, b) => b.value - a.value)
      return sorted.slice(0, 5)
    } catch (err) {
      console.error('Error parsing cost data:', err)
      return []
    }
  }

  const parseReportFile = (content: string): RevenueData | null => {
    try {
      const lines = content.split('\n')
      
      // Suche nach "Detaillierte Einnahmen (pro Woche, Netto nach MwSt.):"
      let foundSection = false
      const data: Partial<RevenueData> = {
        name: 'Analyse',
        tickets: 0,
        gastronomy: 0,
        dailyGastronomy: 0,
        courses: 0,
        workshops: 0,
        rental: 0,
        fixedIncome: 0,
        funding: 0,
        memberships: 0,
        total: 0,
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.includes('Detaillierte Einnahmen') || line.includes('Detailed Revenue')) {
          foundSection = true
          continue
        }

        if (foundSection) {
          // Parse verschiedene Einnahmenquellen
          if (line.includes('Fixeinnahmen') || line.includes('Fixed Income')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.fixedIncome = value
            }
          }
          
          if (line.includes('Querfinanzierung') || line.includes('Funding')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.funding = value
            }
          }
          
          if (line.includes('Mitgliedsbeiträge') || line.includes('Membership')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.memberships = value
            }
          }
          
          if (line.includes('Ticket-Einnahmen') || line.includes('Ticket Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.tickets = value
            }
          }
          
          if (line.includes('Gastronomie-Einnahmen (pro Ticket)') || line.includes('Gastronomy Revenue (per Ticket)')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.gastronomy = value
            }
          }
          
          if (line.includes('Tägliche Gastronomie-Einnahmen') || line.includes('Daily Gastronomy Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.dailyGastronomy = value
            }
          }
          
          if (line.includes('Kurs 1 Einnahmen') || line.includes('Course 1 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Kurs 2 Einnahmen') || line.includes('Course 2 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Kurs 3 Einnahmen') || line.includes('Course 3 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Workshop-Einnahmen') || line.includes('Workshop Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.workshops = value
            }
          }
          
          if (line.includes('Vermietungs-Einnahmen') || line.includes('Rental Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.rental = value
            }
          }

          // Wenn wir zur nächsten Sektion kommen, stoppen
          if (line.includes('Detaillierte Kosten') || line.includes('Detailed Costs') || line.includes('===')) {
            break
          }
        }
      }

      // Versuche auch Jahreswerte zu finden (falls wöchentliche Werte nicht gefunden wurden)
      if (data.total === 0) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          
          // Suche nach Jahreswerten
          if (line.includes('Gesamt-Einnahmen (Brutto)') || line.includes('Total Revenue (Gross)')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const totalGross = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              // Versuche Netto-Wert zu finden
              const nextLine = lines[i + 1]?.trim() || ''
              if (nextLine.includes('Gesamt-Einnahmen (Netto)') || nextLine.includes('Total Revenue (Net)')) {
                const netMatch = nextLine.match(/[-:]?\s*([\d.,]+)\s*€/)
                if (netMatch) {
                  data.total = parseFloat(netMatch[1].replace(/\./g, '').replace(',', '.'))
                }
              }
            }
            break
          }
        }
      }

      // Berechne Gesamtsumme
      data.total = (data.tickets || 0) + (data.gastronomy || 0) + (data.dailyGastronomy || 0) + 
                   (data.courses || 0) + (data.workshops || 0) + (data.rental || 0) + 
                   (data.fixedIncome || 0) + (data.funding || 0) + (data.memberships || 0)
      
      // Wenn Gesamtsumme noch 0 ist, versuche aus einzelnen Werten zu berechnen
      if (data.total === 0) {
        data.total = (data.tickets || 0) + (data.gastronomy || 0) + (data.dailyGastronomy || 0) + 
                     (data.courses || 0) + (data.workshops || 0) + (data.rental || 0) + 
                     (data.fixedIncome || 0) + (data.funding || 0) + (data.memberships || 0)
      }

      // Prüfe, ob wir Daten gefunden haben
      if (data.total === 0) {
        return null
      }

      return data as RevenueData
    } catch (err) {
      console.error('Error parsing report:', err)
      return null
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError(locale === 'de' ? 'Bitte wählen Sie eine .txt Datei aus.' : 'Please select a .txt file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
      
      const parsed = parseReportFile(content)
      const liquidityParsed = parseLiquidityData(content)
      const weeklyParsed = parseWeeklyData(content)
      const costParsed = parseCostData(content)
      
      if (parsed) {
        setRevenueData(parsed)
        setLiquidityData(liquidityParsed.data)
        setLiquidityBuffer(liquidityParsed.buffer)
        setWeeklyData(weeklyParsed)
        setCostData(costParsed)
        setError(null)
      } else {
        setError(locale === 'de' 
          ? 'Konnte keine Einnahmendaten aus der Datei extrahieren. Bitte stellen Sie sicher, dass es sich um eine gültige Analyse-Datei handelt.'
          : 'Could not extract revenue data from file. Please ensure it is a valid analysis file.')
        setRevenueData(null)
        setLiquidityData([])
        setWeeklyData([])
        setCostData([])
      }
    }
    reader.onerror = () => {
      setError(locale === 'de' ? 'Fehler beim Lesen der Datei.' : 'Error reading file.')
    }
    reader.readAsText(file)
  }

  const prepareChartData = () => {
    if (!revenueData) return []

    const total = revenueData.total
    if (total === 0) return []

    return [
      {
        name: locale === 'de' ? 'Umsatz-Mix' : 'Revenue Mix',
        tickets: revenueData.tickets,
        gastronomy: revenueData.gastronomy,
        dailyGastronomy: revenueData.dailyGastronomy,
        courses: revenueData.courses,
        workshops: revenueData.workshops,
        rental: revenueData.rental,
        fixedIncome: revenueData.fixedIncome,
        funding: revenueData.funding,
        memberships: revenueData.memberships,
        ticketsPercent: (revenueData.tickets / total) * 100,
        gastronomyPercent: (revenueData.gastronomy / total) * 100,
        dailyGastronomyPercent: (revenueData.dailyGastronomy / total) * 100,
        coursesPercent: (revenueData.courses / total) * 100,
        workshopsPercent: (revenueData.workshops / total) * 100,
        rentalPercent: (revenueData.rental / total) * 100,
        fixedIncomePercent: (revenueData.fixedIncome / total) * 100,
        fundingPercent: (revenueData.funding / total) * 100,
        membershipsPercent: (revenueData.memberships / total) * 100,
      }
    ]
  }

  const chartData = prepareChartData()

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            {locale === 'de' ? 'Diagramme' : 'Diagrams'}
          </h1>
          <p className="text-zinc-600">
            {locale === 'de' 
              ? 'Laden Sie eine heruntergeladene Analyse hoch, um visuelle Diagramme zu erstellen'
              : 'Upload a downloaded analysis to create visual diagrams'}
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900">
            {locale === 'de' ? 'Analyse-Datei hochladen' : 'Upload Analysis File'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {locale === 'de' ? 'Datei auswählen' : 'Select File'}
            </label>
            {fileContent && (
              <span className="text-sm text-zinc-600">
                {locale === 'de' ? 'Datei geladen' : 'File loaded'}
              </span>
            )}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}
        </div>

        {/* Charts */}
        {revenueData && chartData.length > 0 && (
          <div className="space-y-8">
            {/* 100% Stacked Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-6" ref={revenuePercentChartRef}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">
                    {locale === 'de' ? 'Umsatz-Mix (Anteile)' : 'Revenue Mix (Percentages)'}
                  </h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    {locale === 'de' 
                      ? 'Zeigt die prozentuale Verteilung der Einnahmenquellen'
                      : 'Shows the percentage distribution of revenue sources'}
                  </p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(revenuePercentChartRef, 'umsatz-mix-anteile.png')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  📥 {locale === 'de' ? 'Als PNG' : 'Download PNG'}
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Legend />
                  <Bar dataKey="ticketsPercent" stackId="a" fill={COLORS.tickets} name={locale === 'de' ? 'Tickets' : 'Tickets'} />
                  <Bar dataKey="gastronomyPercent" stackId="a" fill={COLORS.gastronomy} name={locale === 'de' ? 'Gastronomie (pro Ticket)' : 'Gastronomy (per Ticket)'} />
                  <Bar dataKey="dailyGastronomyPercent" stackId="a" fill={COLORS.dailyGastronomy} name={locale === 'de' ? 'Tägliche Gastronomie' : 'Daily Gastronomy'} />
                  <Bar dataKey="coursesPercent" stackId="a" fill={COLORS.courses} name={locale === 'de' ? 'Kurse' : 'Courses'} />
                  <Bar dataKey="workshopsPercent" stackId="a" fill={COLORS.workshops} name={locale === 'de' ? 'Workshops' : 'Workshops'} />
                  <Bar dataKey="rentalPercent" stackId="a" fill={COLORS.rental} name={locale === 'de' ? 'Vermietung' : 'Rental'} />
                  <Bar dataKey="fixedIncomePercent" stackId="a" fill={COLORS.fixedIncome} name={locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'} />
                  <Bar dataKey="fundingPercent" stackId="a" fill={COLORS.funding} name={locale === 'de' ? 'Förderung' : 'Funding'} />
                  <Bar dataKey="membershipsPercent" stackId="a" fill={COLORS.memberships} name={locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Absolute Stacked Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-6" ref={revenueAbsoluteChartRef}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">
                    {locale === 'de' ? 'Umsatz-Mix (Absolute Werte)' : 'Revenue Mix (Absolute Values)'}
                  </h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    {locale === 'de' 
                      ? 'Zeigt die absoluten Einnahmenwerte in Euro'
                      : 'Shows the absolute revenue values in Euros'}
                  </p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(revenueAbsoluteChartRef, 'umsatz-mix-absolute.png')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  📥 {locale === 'de' ? 'Als PNG' : 'Download PNG'}
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} €`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Legend />
                  <Bar dataKey="tickets" stackId="a" fill={COLORS.tickets} name={locale === 'de' ? 'Tickets' : 'Tickets'} />
                  <Bar dataKey="gastronomy" stackId="a" fill={COLORS.gastronomy} name={locale === 'de' ? 'Gastronomie (pro Ticket)' : 'Gastronomy (per Ticket)'} />
                  <Bar dataKey="dailyGastronomy" stackId="a" fill={COLORS.dailyGastronomy} name={locale === 'de' ? 'Tägliche Gastronomie' : 'Daily Gastronomy'} />
                  <Bar dataKey="courses" stackId="a" fill={COLORS.courses} name={locale === 'de' ? 'Kurse' : 'Courses'} />
                  <Bar dataKey="workshops" stackId="a" fill={COLORS.workshops} name={locale === 'de' ? 'Workshops' : 'Workshops'} />
                  <Bar dataKey="rental" stackId="a" fill={COLORS.rental} name={locale === 'de' ? 'Vermietung' : 'Rental'} />
                  <Bar dataKey="fixedIncome" stackId="a" fill={COLORS.fixedIncome} name={locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'} />
                  <Bar dataKey="funding" stackId="a" fill={COLORS.funding} name={locale === 'de' ? 'Förderung' : 'Funding'} />
                  <Bar dataKey="memberships" stackId="a" fill={COLORS.memberships} name={locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900">
                {locale === 'de' ? 'Zusammenfassung' : 'Summary'}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {locale === 'de' ? 'Einnahmenquelle' : 'Revenue Source'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {locale === 'de' ? 'Wert (€)' : 'Value (€)'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {locale === 'de' ? 'Anteil (%)' : 'Share (%)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {revenueData.tickets > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Tickets' : 'Tickets'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.tickets.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.tickets / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.gastronomy > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Gastronomie (pro Ticket)' : 'Gastronomy (per Ticket)'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.gastronomy.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.gastronomy / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.dailyGastronomy > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Tägliche Gastronomie' : 'Daily Gastronomy'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.dailyGastronomy.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.dailyGastronomy / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.courses > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Kurse' : 'Courses'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.courses.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.courses / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.workshops > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Workshops' : 'Workshops'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.workshops.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.workshops / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.rental > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Vermietung' : 'Rental'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.rental.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.rental / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.fixedIncome > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.fixedIncome.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.fixedIncome / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.funding > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Förderung' : 'Funding'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.funding.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.funding / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.memberships > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {revenueData.memberships.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {((revenueData.memberships / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    <tr className="bg-zinc-50 font-semibold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {locale === 'de' ? 'Gesamt' : 'Total'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {revenueData.total.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        100.00%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liquidity Line Chart */}
            {liquidityData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6" ref={liquidityChartRef}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      {locale === 'de' ? 'Liquidität über 52 Wochen' : 'Liquidity over 52 Weeks'}
                    </h2>
                    <p className="text-sm text-zinc-600 mt-1">
                      {locale === 'de' 
                        ? 'Zeigt die Liquiditätsentwicklung über das Jahr. Die horizontale Linie zeigt den Liquiditätspuffer.'
                        : 'Shows liquidity development over the year. The horizontal line shows the liquidity buffer.'}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadChartAsPNG(liquidityChartRef, 'liquiditaet-52-wochen.png')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    📥 {locale === 'de' ? 'Als PNG' : 'Download PNG'}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={liquidityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      label={{ value: locale === 'de' ? 'Kalenderwoche' : 'Calendar Week', position: 'insideBottom', offset: -5 }}
                      domain={[1, 52]}
                      tickCount={13}
                    />
                    <YAxis 
                      label={{ value: locale === 'de' ? 'Liquidität (€)' : 'Liquidity (€)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)} €`}
                      labelFormatter={(week) => `${locale === 'de' ? 'KW' : 'Week'} ${week}`}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    />
                    <Legend />
                    <ReferenceLine 
                      y={liquidityBuffer} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      label={{ value: locale === 'de' ? `Puffer (${liquidityBuffer.toFixed(0)} €)` : `Buffer (${liquidityBuffer.toFixed(0)} €)`, position: 'right' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="liquidity" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={(props: any) => {
                        const isMin = liquidityData[props.payloadIndex]?.isMinimum
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isMin ? 8 : 3}
                            fill={isMin ? '#f59e0b' : '#3b82f6'}
                            stroke={isMin ? '#f59e0b' : '#3b82f6'}
                            strokeWidth={isMin ? 2 : 0}
                          />
                        )
                      }}
                      activeDot={{ r: 6 }}
                      name={locale === 'de' ? 'Liquidität' : 'Liquidity'}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-zinc-50 rounded-md">
                  <p className="text-sm text-zinc-700">
                    <strong>{locale === 'de' ? 'Liquiditätspuffer' : 'Liquidity Buffer'}:</strong> {liquidityBuffer.toFixed(2)} €
                  </p>
                  {liquidityData.length > 0 && (
                    <>
                      <p className="text-sm text-zinc-700 mt-1">
                        <strong>{locale === 'de' ? 'Minimale Liquidität' : 'Minimum Liquidity'}:</strong>{' '}
                        {Math.min(...liquidityData.map(d => d.liquidity)).toFixed(2)} €
                        {Math.min(...liquidityData.map(d => d.liquidity)) < liquidityBuffer && (
                          <span className="ml-2 text-red-600">
                            ⚠️ {locale === 'de' ? 'Unter Puffer!' : 'Below buffer!'}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-zinc-700 mt-1">
                        <strong>{locale === 'de' ? 'Liquidität am Jahresende' : 'End of Year Liquidity'}:</strong>{' '}
                        {liquidityData[liquidityData.length - 1]?.liquidity.toFixed(2)} €
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Revenue vs Costs Combo Chart */}
            {weeklyData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6" ref={revenueCostsChartRef}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      {locale === 'de' ? 'Einnahmen vs. Ausgaben pro Woche' : 'Revenue vs. Costs per Week'}
                    </h2>
                    <p className="text-sm text-zinc-600 mt-1">
                      {locale === 'de' 
                        ? 'Zeigt, wann ihr profitabel seid und wann nicht. Der Hintergrund zeigt den Status jeder Woche (Schwach/Normal).'
                        : 'Shows when you are profitable and when not. The background shows the status of each week (Weak/Normal).'}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadChartAsPNG(revenueCostsChartRef, 'einnahmen-vs-ausgaben.png')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    📥 {locale === 'de' ? 'Als PNG' : 'Download PNG'}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart data={weeklyData}>
                    <defs>
                      <linearGradient id="weakGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fef3c7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#dbeafe" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="strongGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dcfce7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#dcfce7" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      label={{ value: locale === 'de' ? 'Kalenderwoche' : 'Calendar Week', position: 'insideBottom', offset: -5 }}
                      domain={[1, 52]}
                      tickCount={13}
                    />
                    <YAxis 
                      label={{ value: locale === 'de' ? 'Betrag (€)' : 'Amount (€)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const label = name === 'revenue' 
                          ? (locale === 'de' ? 'Einnahmen' : 'Revenue')
                          : (locale === 'de' ? 'Ausgaben' : 'Costs')
                        return [`${value.toFixed(2)} €`, label]
                      }}
                      labelFormatter={(week, payload) => {
                        if (payload && payload[0]) {
                          const status = (payload[0].payload as WeeklyData).status
                          return `${locale === 'de' ? 'KW' : 'Week'} ${week} (${status})`
                        }
                        return `${locale === 'de' ? 'KW' : 'Week'} ${week}`
                      }}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    />
                    <Legend />
                    {/* Background areas by status - grouped */}
                    {(() => {
                      const areas: Array<{ x1: number; x2: number; fill: string }> = []
                      let currentStatus: WeeklyData['status'] | null = null
                      let startWeek = 0
                      
                      weeklyData.forEach((entry, index) => {
                        const status = entry.status
                        const normalizedStatus = 
                          status === 'Schwach' || status === 'Keine Einn.' || status === 'Ausgeschlossen' ? 'Schwach' :
                          status === 'Stark' ? 'Stark' :
                          'Normal'
                        
                        if (normalizedStatus !== currentStatus) {
                          // End previous area
                          if (currentStatus !== null && startWeek > 0) {
                            const fill = 
                              currentStatus === 'Schwach' ? 'url(#weakGradient)' :
                              currentStatus === 'Stark' ? 'url(#strongGradient)' :
                              'url(#normalGradient)'
                            areas.push({
                              x1: startWeek - 0.5,
                              x2: entry.week - 0.5,
                              fill
                            })
                          }
                          // Start new area
                          currentStatus = normalizedStatus
                          startWeek = entry.week
                        }
                        
                        // End area at last entry
                        if (index === weeklyData.length - 1) {
                          const fill = 
                            normalizedStatus === 'Schwach' ? 'url(#weakGradient)' :
                            normalizedStatus === 'Stark' ? 'url(#strongGradient)' :
                            'url(#normalGradient)'
                          areas.push({
                            x1: startWeek - 0.5,
                            x2: entry.week + 0.5,
                            fill
                          })
                        }
                      })
                      
                      return areas.map((area, index) => (
                        <ReferenceArea
                          key={`area-${index}`}
                          x1={area.x1}
                          x2={area.x2}
                          fill={area.fill}
                          stroke="none"
                        />
                      ))
                    })()}
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                      name={locale === 'de' ? 'Einnahmen' : 'Revenue'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costs" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                      name={locale === 'de' ? 'Ausgaben' : 'Costs'}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-zinc-50 rounded-md">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                      <span className="text-zinc-700">{locale === 'de' ? 'Schwach' : 'Weak'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-200 rounded"></div>
                      <span className="text-zinc-700">{locale === 'de' ? 'Normal' : 'Normal'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-200 rounded"></div>
                      <span className="text-zinc-700">{locale === 'de' ? 'Stark' : 'Strong'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {locale === 'de' 
                      ? 'Grün = Einnahmen über Ausgaben (profitabel), Rot = Ausgaben über Einnahmen (Verlust)'
                      : 'Green = Revenue above costs (profitable), Red = Costs above revenue (loss)'}
                  </p>
                </div>
              </div>
            )}

            {/* Cost Structure Bar Chart - Top 5 */}
            {costData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6" ref={costStructureChartRef}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      {locale === 'de' ? 'Kostenstruktur (Top 5)' : 'Cost Structure (Top 5)'}
                    </h2>
                    <p className="text-sm text-zinc-600 mt-1">
                      {locale === 'de' 
                        ? 'Zeigt die wichtigsten Kostenblöcke pro Jahr. Große Blöcke wie Gehälter und Marketing sind entscheidend.'
                        : 'Shows the most important cost blocks per year. Large blocks like salaries and marketing are decisive.'}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadChartAsPNG(costStructureChartRef, 'kostenstruktur-top5.png')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    📥 {locale === 'de' ? 'Als PNG' : 'Download PNG'}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={costData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      width={180}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)} €`}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#ef4444"
                      radius={[0, 4, 4, 0]}
                    >
                      {costData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'salaries' ? '#ef4444' :
                            entry.name === 'marketing' ? '#f59e0b' :
                            entry.name === 'rent' ? '#8b5cf6' :
                            entry.name === 'heating' ? '#06b6d4' :
                            entry.name === 'technology' ? '#10b981' :
                            '#6366f1'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-zinc-50 rounded-md">
                  <p className="text-sm font-semibold text-zinc-900 mb-2">
                    {locale === 'de' ? 'Top 5 Kostenblöcke (jährlich):' : 'Top 5 Cost Blocks (annual):'}
                  </p>
                  <div className="space-y-1">
                    {costData.map((cost, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-zinc-700">
                          {index + 1}. {cost.label}
                        </span>
                        <span className="font-medium text-zinc-900">
                          {cost.value.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!revenueData && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-zinc-600">
              {locale === 'de' 
                ? 'Bitte laden Sie eine Analyse-Datei hoch, um Diagramme zu erstellen.'
                : 'Please upload an analysis file to create diagrams.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
