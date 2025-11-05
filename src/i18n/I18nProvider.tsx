'use client'
import { useEffect } from 'react'
import './config'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n is initialized on mount
  }, [])

  return <>{children}</>
}
