export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    // Primary brand colors
    primary: string
    primaryHover: string
    primaryLight: string
    primaryDark: string
    
    // Secondary/accent colors
    secondary: string
    secondaryHover: string
    accent: string
    
    // UI colors
    background: string
    surface: string
    border: string
    
    // Text colors
    textPrimary: string
    textSecondary: string
    textOnPrimary: string
    
    // Status colors
    success: string
    warning: string
    error: string
    info: string
  }
}

export const themes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern blue theme',
    colors: {
      primary: '#2563eb',        // blue-600
      primaryHover: '#1d4ed8',   // blue-700
      primaryLight: '#dbeafe',   // blue-100
      primaryDark: '#1e40af',    // blue-800
      
      secondary: '#7c3aed',      // violet-600
      secondaryHover: '#6d28d9', // violet-700
      accent: '#10b981',         // emerald-500
      
      background: '#f9fafb',     // gray-50
      surface: '#ffffff',        // white
      border: '#e5e7eb',         // gray-200
      
      textPrimary: '#111827',    // gray-900
      textSecondary: '#6b7280',  // gray-500
      textOnPrimary: '#ffffff',  // white
      
      success: '#10b981',        // emerald-500
      warning: '#f59e0b',        // amber-500
      error: '#ef4444',          // red-500
      info: '#3b82f6',           // blue-500
    },
  },
  
  opm: {
    id: 'opm',
    name: 'OPM Heerenveen',
    description: 'Official OPM Heerenveen volleyball club colors',
    colors: {
      primary: '#060035',        // Deep navy (OPM primary)
      primaryHover: '#04001f',   // Darker navy
      primaryLight: '#e8e7eb',   // Light navy tint
      primaryDark: '#02000a',    // Almost black
      
      secondary: '#00d084',      // Bright teal (OPM accent)
      secondaryHover: '#00b872', // Darker teal
      accent: '#77d633',         // Bright green (OPM secondary)
      
      background: '#f8f8f8',     // Very light gray
      surface: '#ffffff',        // White
      border: '#abb8c3',         // Light blue-gray
      
      textPrimary: '#060035',    // Dark navy
      textSecondary: '#32373c',  // Dark gray
      textOnPrimary: '#ffffff',  // White
      
      success: '#77d633',        // Bright green
      warning: '#fcb900',        // Yellow
      error: '#cf2e2e',          // Red
      info: '#0693e3',           // Blue
    },
  },
}

export function getTheme(themeId: string = 'default'): Theme {
  return themes[themeId] || themes.default
}

export function getAvailableThemes(): Theme[] {
  return Object.values(themes)
}
