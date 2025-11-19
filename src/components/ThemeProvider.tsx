"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { themes, type ThemeName, type Theme } from '@/config/themes'

interface ThemeContextType {
  theme: Theme
  setTheme: (themeName: ThemeName) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: string | null
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    themes[initialTheme as ThemeName] || themes.default
  )
  const [isLoading, setIsLoading] = useState(false)

  const updateTheme = async (themeName: ThemeName) => {
    setIsLoading(true)
    try {
      // Update theme in database via API
      const response = await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeName })
      })

      if (response.ok) {
        setCurrentTheme(themes[themeName])
        // Store in localStorage as backup
        localStorage.setItem('theme-preference', themeName)
      } else {
        throw new Error('Failed to update theme')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme-preference')
    if (stored && stored !== currentTheme.name) {
      setCurrentTheme(themes[stored as ThemeName] || themes.default)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: updateTheme, isLoading }}>
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
