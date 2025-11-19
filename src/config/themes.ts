/**
 * Theme Configuration
 * Defines available themes that can be applied app-wide
 */

export type ThemeName = 'default' | 'opm-dark' | 'solarized-light' | 'solarized-dark' | 'nord' | 'dracula'

export interface Theme {
  id: ThemeName
  name: string
  description: string
  colors: {
    // For preview in theme selector
    primary: string
    secondary: string
    accent: string
  }
  // CSS classes that will be applied to the root element
  classes: {
    // Backgrounds
    bgBody: string
    bgPrimary: string
    bgSecondary: string
    bgTertiary: string
    
    // Text colors
    textPrimary: string
    textSecondary: string
    textTertiary: string
    
    // Borders
    borderPrimary: string
    borderSecondary: string
    
    // Accents
    accentPrimary: string
    accentSecondary: string
    accentTertiary: string
    
    // Interactive states
    hoverBg: string
    
    // Shadow
    shadow: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    id: 'default',
    name: 'Default Light',
    description: 'Clean and professional light theme',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
    },
    classes: {
      bgBody: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgTertiary: 'bg-gray-100',
      
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      
      borderPrimary: 'border-gray-200',
      borderSecondary: 'border-gray-300',
      
      accentPrimary: 'text-blue-600',
      accentSecondary: 'text-purple-600',
      accentTertiary: 'text-green-600',
      
      hoverBg: 'hover:bg-gray-50',
      
      shadow: 'shadow-sm',
    }
  },
  
  'opm-dark': {
    id: 'opm-dark',
    name: 'OPM Heerenveen Dark',
    description: 'Dark theme with OPM Heerenveen branding',
    colors: {
      primary: '#060035', // Navy
      secondary: '#00c49a', // Teal
      accent: '#fb8f67',   // Orange
    },
    classes: {
      bgBody: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800',
      bgPrimary: 'bg-slate-900',
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-700',
      
      textPrimary: 'text-white',
      textSecondary: 'text-slate-300',
      textTertiary: 'text-slate-400',
      
      borderPrimary: 'border-slate-700',
      borderSecondary: 'border-slate-600',
      
      accentPrimary: 'text-blue-400',
      accentSecondary: 'text-teal-400',
      accentTertiary: 'text-orange-400',
      
      hoverBg: 'hover:bg-slate-700',
      
      shadow: 'shadow-lg',
    }
  },
  
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Precision colors for machines and people',
    colors: {
      primary: '#268bd2',
      secondary: '#2aa198',
      accent: '#859900',
    },
    classes: {
      bgBody: 'bg-[#fdf6e3]',
      bgPrimary: 'bg-[#eee8d5]',
      bgSecondary: 'bg-[#fdf6e3]',
      bgTertiary: 'bg-[#eee8d5]',
      
      textPrimary: 'text-[#073642]',
      textSecondary: 'text-[#586e75]',
      textTertiary: 'text-[#657b83]',
      
      borderPrimary: 'border-[#93a1a1]',
      borderSecondary: 'border-[#839496]',
      
      accentPrimary: 'text-[#268bd2]',
      accentSecondary: 'text-[#2aa198]',
      accentTertiary: 'text-[#859900]',
      
      hoverBg: 'hover:bg-[#fdf6e3]',
      
      shadow: 'shadow-sm',
    }
  },
  
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Precision colors for machines and people (dark)',
    colors: {
      primary: '#268bd2',
      secondary: '#2aa198',
      accent: '#859900',
    },
    classes: {
      bgBody: 'bg-[#002b36]',
      bgPrimary: 'bg-[#073642]',
      bgSecondary: 'bg-[#002b36]',
      bgTertiary: 'bg-[#073642]',
      
      textPrimary: 'text-[#fdf6e3]',
      textSecondary: 'text-[#93a1a1]',
      textTertiary: 'text-[#839496]',
      
      borderPrimary: 'border-[#586e75]',
      borderSecondary: 'border-[#657b83]',
      
      accentPrimary: 'text-[#268bd2]',
      accentSecondary: 'text-[#2aa198]',
      accentTertiary: 'text-[#859900]',
      
      hoverBg: 'hover:bg-[#073642]',
      
      shadow: 'shadow-lg',
    }
  },
  
  nord: {
    id: 'nord',
    name: 'Nord',
    description: 'Arctic, north-bluish color palette',
    colors: {
      primary: '#5E81AC',
      secondary: '#88C0D0',
      accent: '#A3BE8C',
    },
    classes: {
      bgBody: 'bg-gradient-to-br from-[#2E3440] via-[#3B4252] to-[#2E3440]',
      bgPrimary: 'bg-[#3B4252]',
      bgSecondary: 'bg-[#2E3440]',
      bgTertiary: 'bg-[#434C5E]',
      
      textPrimary: 'text-[#ECEFF4]',
      textSecondary: 'text-[#D8DEE9]',
      textTertiary: 'text-[#81A1C1]',
      
      borderPrimary: 'border-[#4C566A]',
      borderSecondary: 'border-[#434C5E]',
      
      accentPrimary: 'text-[#5E81AC]',
      accentSecondary: 'text-[#88C0D0]',
      accentTertiary: 'text-[#A3BE8C]',
      
      hoverBg: 'hover:bg-[#434C5E]',
      
      shadow: 'shadow-lg',
    }
  },
  
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    description: 'Dark theme with vibrant colors',
    colors: {
      primary: '#bd93f9',
      secondary: '#ff79c6',
      accent: '#50fa7b',
    },
    classes: {
      bgBody: 'bg-gradient-to-br from-[#282a36] via-[#1e1f29] to-[#282a36]',
      bgPrimary: 'bg-[#282a36]',
      bgSecondary: 'bg-[#1e1f29]',
      bgTertiary: 'bg-[#44475a]',
      
      textPrimary: 'text-[#f8f8f2]',
      textSecondary: 'text-[#e5e9f0]',
      textTertiary: 'text-[#6272a4]',
      
      borderPrimary: 'border-[#44475a]',
      borderSecondary: 'border-[#6272a4]',
      
      accentPrimary: 'text-[#bd93f9]',
      accentSecondary: 'text-[#ff79c6]',
      accentTertiary: 'text-[#50fa7b]',
      
      hoverBg: 'hover:bg-[#44475a]',
      
      shadow: 'shadow-lg',
    }
  }
}

/**
 * Get theme by name with fallback to default
 */
export function getTheme(themeName?: string | null): Theme {
  if (!themeName || !(themeName in themes)) {
    return themes.default
  }
  return themes[themeName as ThemeName]
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes)
}
