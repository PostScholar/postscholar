'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './Nav.module.css'

/**
 * Nav — top navigation bar
 *
 * Left: PostScholar wordmark
 * Right: Start a discussion link, sign in / username
 *
 * Sentence case throughout, no emojis, no icons except the wordmark.
 */
export default function Nav() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark}>
          PostScholar
        </Link>

        {/* Right side */}
        <div className={styles.right}>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme">
            {theme === 'light' ? '☾' : '☀'}
          </button>
          {user ? (
            <>
              <Link
                href="/start"
                className={styles.startBtn}
              >
                Start a discussion
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.username}>{user.username}</span>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`${styles.navLink} ${pathname === '/login' ? styles.active : ''}`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={styles.registerBtn}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}