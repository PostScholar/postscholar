import Nav from './Nav'
import styles from './Layout.module.css'

/**
 * Layout — root layout wrapper
 *
 * Wraps every page with the Nav and a centered content area.
 * Pages that need a sidebar pass sidebar prop.
 */
export default function Layout({ children, sidebar = null }) {
  return (
    <div className={styles.root}>
      <Nav />
      <div className={styles.body}>
        <main className={`${styles.main} ${sidebar ? styles.withSidebar : ''}`}>
          {children}
        </main>
        {sidebar && (
          <aside className={styles.sidebar}>
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
