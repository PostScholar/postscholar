'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import Logo from './Logo'
import { Search, Moon, Sun, Menu, X, Bell, User, Settings, LogOut, Shield } from 'lucide-react'
import { getUnreadMentionCount } from '@/lib/api'
import styles from './Nav.module.css'

function getInitials(username) {
  return username ? username.slice(0, 2).toUpperCase() : '?'
}

export default function Nav() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const profileRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!profileOpen) return
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

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
    setProfileOpen(false)
    await logout()
    router.push('/login')
  }

  const profileMenu = user && (
    <div className={styles.profileWrap} ref={profileRef}>
      <button
        type="button"
        className={`${styles.profileTrigger} ${profileOpen ? styles.profileTriggerOpen : ''}`}
        onClick={() => setProfileOpen(!profileOpen)}
        aria-label="Account menu"
        aria-expanded={profileOpen}
      >
        <span className={styles.profileAvatar}>{getInitials(user.username)}</span>
      </button>
      {profileOpen && (
        <div className={styles.profileMenu}>
          <div className={styles.profileHeader}>
            <span className={styles.profileAvatarLarge}>{getInitials(user.username)}</span>
            <div className={styles.profileMeta}>
              <span className={styles.profileName}>{user.username}</span>
              <span className={styles.profileHint}>Signed in</span>
            </div>
          </div>
          <div className={styles.profileDivider} />
          <Link
            href={`/u/${user.username}`}
            className={styles.profileItem}
            onClick={() => setProfileOpen(false)}
          >
            <User size={16} />
            Your profile
          </Link>
          <Link
            href="/settings"
            className={styles.profileItem}
            onClick={() => setProfileOpen(false)}
          >
            <Settings size={16} />
            Settings
          </Link>
          {(user.role === 'moderator' || user.role === 'admin') && (
            <Link
              href="/moderation"
              className={styles.profileItem}
              onClick={() => setProfileOpen(false)}
            >
              <Shield size={16} />
              Moderation
            </Link>
          )}
          <div className={styles.profileDivider} />
          <button type="button" className={styles.profileItem} onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Logo variant="full" href="/" />

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
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme" title={`Theme: ${theme}`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {user && (
            <Link href="/mentions" className={styles.mentionsBtn} aria-label="Mentions" onClick={() => setMenuOpen(false)}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
          )}
          {user ? (
            <Link href="/start" className={styles.startBtn} onClick={() => setMenuOpen(false)}>
              Start a discussion
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`${styles.navLink} ${pathname === '/login' ? styles.active : ''}`}
              >
                Sign in
              </Link>
              <Link href="/register" className={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className={styles.profileBar}>
            <Link
              href="/mentions"
              className={`${styles.mentionsBtn} ${styles.mentionsBtnMobile}`}
              aria-label="Mentions"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
            {profileMenu}
          </div>
        )}

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  )
}
