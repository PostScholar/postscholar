'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Search, Moon, Sun, Menu, X } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

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

        {/* Search */}
        <form onSubmit={handleSearch} className={styles.search}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            <Search size={16} />
          </button>
        </form>

        {/* Hamburger menu (mobile only) */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Right side */}
        <div className={`${styles.right} ${menuOpen ? styles.open : ''}`}>
          <Link
            href="/explore"
            className={`${styles.navLink} ${pathname === '/explore' ? styles.active : ''}`}
          >
            Discussions
          </Link>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
                <Link href={`/u/${user.username}`} className={styles.username}>
                  {user.username}
                </Link>
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