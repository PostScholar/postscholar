'use client'

import Nav from './Nav'
import Footer from './Footer'
import styles from './Layout.module.css'

/**
 * Layout — root layout wrapper
 *
 * Wraps every page with the Nav and a centered content area.
 * Pages that need a sidebar pass sidebar prop.
 * Pass bare={true} for landing page (no padding, full width).
 */
export default function Layout({ children, sidebar = null, bare = false }) {
  return (
    <div className={styles.root}>
      <Nav />
      <div className={styles.body}>
        {sidebar ? (
          <div className={styles.withSidebar}>
            <main className={styles.mainContent}>
              {children}
            </main>
            <aside className={styles.sidebar}>
              {sidebar}
            </aside>
          </div>
        ) : bare ? (
          <main className={styles.bare}>
            {children}
          </main>
        ) : (
          <main className={styles.main}>
            {children}
          </main>
        )}
      </div>
      <Footer />
    </div>
  )
}