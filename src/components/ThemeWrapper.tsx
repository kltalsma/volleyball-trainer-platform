"use client"

import { useEffect, useState } from 'react'
import { getTheme } from '@/config/themes'

interface ThemeWrapperProps {
  children: React.ReactNode
  userTheme?: string | null
}

/**
 * ThemeWrapper - Applies theme classes to all child content
 * This component should wrap the entire app content in the layout
 */
export function ThemeWrapper({ children, userTheme }: ThemeWrapperProps) {
  const [currentTheme, setCurrentTheme] = useState(getTheme(userTheme))

  useEffect(() => {
    // Update theme when user preference changes
    setCurrentTheme(getTheme(userTheme))
  }, [userTheme])

  // Listen for theme updates from the account page
  useEffect(() => {
    const handleThemeUpdate = (event: CustomEvent) => {
      const newTheme = event.detail.theme
      setCurrentTheme(getTheme(newTheme))
    }

    window.addEventListener('theme-changed' as any, handleThemeUpdate)
    return () => {
      window.removeEventListener('theme-changed' as any, handleThemeUpdate)
    }
  }, [])

  const classes = currentTheme.classes

  return (
    <div className={`min-h-screen ${classes.bgBody} ${classes.textPrimary}`}>
      <style jsx global>{`
        /* Apply theme CSS variables for consistent theming */
        :root {
          --theme-bg-primary: ${classes.bgPrimary};
          --theme-bg-secondary: ${classes.bgSecondary};
          --theme-text-primary: ${classes.textPrimary};
          --theme-text-secondary: ${classes.textSecondary};
          --theme-accent-primary: ${classes.accentPrimary};
        }
        
        /* Update card backgrounds */
        .theme-card {
          @apply ${classes.bgPrimary} ${classes.borderPrimary} border ${classes.shadow};
        }
        
        .theme-card-secondary {
          @apply ${classes.bgSecondary} ${classes.borderPrimary} border;
        }
        
        /* Update text colors */
        .theme-text-primary {
          @apply ${classes.textPrimary};
        }
        
        .theme-text-secondary {
          @apply ${classes.textSecondary};
        }
        
        .theme-text-tertiary {
          @apply ${classes.textTertiary};
        }
        
        /* Update link colors */
        .theme-link {
          @apply ${classes.accentPrimary} hover:opacity-80;
        }
        
        /* Update button styles */
        .theme-button-primary {
          @apply bg-blue-600 text-white hover:bg-blue-700;
        }
        
        .theme-button-secondary {
          @apply ${classes.bgSecondary} ${classes.textPrimary} ${classes.borderPrimary} border ${classes.hoverBg};
        }
      `}</style>
      {children}
    </div>
  )
}
