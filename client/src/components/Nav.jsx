import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Wordmark */}
        <Link to="/" className={styles.wordmark}>
          PostScholar
        </Link>

        {/* Right side */}
        <div className={styles.right}>
          {user ? (
            <>
              <Link
                to="/start"
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
                to="/login"
                className={`${styles.navLink} ${location.pathname === '/login' ? styles.active : ''}`}
              >
                Sign in
              </Link>
              <Link
                to="/register"
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