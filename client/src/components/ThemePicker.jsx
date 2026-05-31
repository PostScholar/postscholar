import { useTheme } from '../context/ThemeContext'
import styles from './ThemePicker.module.css'

/**
 * ThemePicker — temporary design-phase component
 *
 * Floats in the bottom-right corner. Lets you toggle between
 * light/dim/dark themes and pick from 8 accent colors live.
 * Remove this component and its import from App.jsx before launch.
 */

const ACCENT_LABELS = {
  blue:       'Blue',
  amber:      'Amber',
  sage:       'Sage',
  rose:       'Rose',
  teal:       'Teal',
  orange:     'Orange',
  violet:     'Violet',
  'steel-red': 'Steel red',
}

export default function ThemePicker() {
  const { theme, setTheme, accent, setAccent, ACCENT_MAP } = useTheme()

  return (
    <div className={styles.picker}>
      <div className={styles.label}>Theme</div>
      <div className={styles.themeRow}>
        {['light', 'dim', 'dark'].map(t => (
          <button
            key={t}
            className={`${styles.themeBtn} ${theme === t ? styles.active : ''}`}
            onClick={() => setTheme(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.label}>Accent</div>
      <div className={styles.accentGrid}>
        {Object.entries(ACCENT_MAP).map(([key, color]) => (
          <button
            key={key}
            className={`${styles.swatch} ${accent === key ? styles.activeSwatch : ''}`}
            style={{ background: color }}
            title={ACCENT_LABELS[key]}
            onClick={() => setAccent(key)}
          />
        ))}
      </div>

      <div className={styles.accentName} style={{ color: ACCENT_MAP[accent] }}>
        {ACCENT_LABELS[accent]}
      </div>
    </div>
  )
}
