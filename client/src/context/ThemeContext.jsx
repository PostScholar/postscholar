import { createContext, useContext, useEffect, useState } from 'react'

/**
 * ThemeContext
 *
 * Manages three things:
 *   1. theme — 'light' | 'dim' | 'dark'
 *   2. accent — one of the 8 accent color keys
 *
 * Both are persisted in localStorage and applied as attributes
 * on <html> so CSS variables pick them up immediately.
 *
 * Usage:
 *   const { theme, setTheme, accent, setAccent } = useTheme()
 */

const ACCENT_MAP = {
  blue:      '#4a7fa5',
  amber:     '#c9933a',
  sage:      '#5a8a6a',
  rose:      '#b56070',
  teal:      '#3d8c8c',
  orange:    '#c46a2d',
  violet:    '#7060a8',
  'steel-red': '#a04545',
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('ps-theme') || 'light'
  )
  const [accent, setAccentState] = useState(() =>
    localStorage.getItem('ps-accent') || 'blue'
  )

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ps-theme', theme)
  }, [theme])

  // Apply accent color as CSS variable on :root
  useEffect(() => {
    const color = ACCENT_MAP[accent]
    if (color) {
      document.documentElement.style.setProperty('--accent', color)
    }
    localStorage.setItem('ps-accent', accent)
  }, [accent])

  function setTheme(t) {
    setThemeState(t)
  }

  function setAccent(a) {
    setAccentState(a)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, ACCENT_MAP }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
