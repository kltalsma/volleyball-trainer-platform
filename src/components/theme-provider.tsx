'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getTheme, type Theme } from '@/lib/themes'

interface ThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'user-theme'

export function ThemeProvider({
  children,
  initialTheme = 'default',
}: {
  children: React.ReactNode
  initialTheme?: string
}) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Priority: localStorage > initialTheme (from session) > default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return getTheme(stored)
      }
    }
    return getTheme(initialTheme)
  })

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    
    // Map theme colors to Tailwind's blue scale for zero-overhead theming
    root.style.setProperty('--blue-50', theme.colors.primaryLight)
    root.style.setProperty('--blue-100', theme.colors.primaryLight)
    root.style.setProperty('--blue-600', theme.colors.primary)
    root.style.setProperty('--blue-700', theme.colors.primaryHover)
    root.style.setProperty('--blue-800', theme.colors.primaryDark)
  }

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  const setTheme = async (themeId: string) => {
    console.log('🎨 Setting theme to:', themeId)
    const newTheme = getTheme(themeId)
    setCurrentTheme(newTheme)
    
    // Save to localStorage immediately (zero latency)
    localStorage.setItem(STORAGE_KEY, themeId)
    console.log('💾 Saved to localStorage:', themeId)

    // Save to server in background (for cross-device sync)
    try {
      const response = await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: themeId }),
      })
      const data = await response.json()
      console.log('✅ Server response:', data)
    } catch (error) {
      console.error('❌ Failed to save theme preference:', error)
      // Theme still works from localStorage, just won't sync across devices
    }
  }

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
