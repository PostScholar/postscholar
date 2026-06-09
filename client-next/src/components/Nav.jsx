'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Search, Moon, Sun, Menu, X, Bell, Bookmark } from 'lucide-react'
import { getUnreadMentionCount } from '@/lib/api'
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
  const searchParams = useSearchParams()
  const isBookmarksView = pathname === '/explore' && searchParams.get('filter') === 'bookmarks'
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (user) {
      getUnreadMentionCount()
        .then(data => setUnreadCount(data.count))
        .catch(() => {})

      const interval = setInterval(() => {
        getUnreadMentionCount()
          .then(data => setUnreadCount(data.count))
          .catch(() => {})
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [user])

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
          Post<span className={styles.wordmarkAccent}>Scholar</span>
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
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/explore"
            className={`${styles.navLink} ${pathname === '/explore' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Discussions
          </Link>
          {user && (
            <Link
              href="/explore?filter=bookmarks"
              className={`${styles.navLink} ${isBookmarksView ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Bookmark size={16} />
              Bookmarks
            </Link>
          )}
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme" title={`Theme: ${theme}`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {user && (
            <Link href="/mentions" className={styles.mentionsBtn} aria-label="Mentions">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
          )}
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
                <Link href="/settings" className={styles.username}>
                  Settings
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