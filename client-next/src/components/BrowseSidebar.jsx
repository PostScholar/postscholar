'use client'

import { Home, Compass, Users, Bookmark } from 'lucide-react'
import styles from './BrowseSidebar.module.css'

export default function BrowseSidebar({ topics = [], activeTopic = '', onTopicChange, activeFilter = 'All', onFilterChange }) {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>BROWSE</h3>
        <nav className={styles.nav}>
          <button
            className={`${styles.navLink} ${activeFilter === 'All' ? styles.active : ''}`}
            onClick={() => onFilterChange('All')}
          >
            <Home size={16} />
            Feed
          </button>
          <button
            className={`${styles.navLink} ${activeFilter === 'New' ? styles.active : ''}`}
            onClick={() => onFilterChange('New')}
          >
            <Compass size={16} />
            Explore
          </button>
          <button
            className={`${styles.navLink} ${activeFilter === 'Following' ? styles.active : ''}`}
            onClick={() => onFilterChange('Following')}
          >
            <Users size={16} />
            Following
          </button>
          <button
            className={`${styles.navLink} ${activeFilter === 'Bookmarks' ? styles.active : ''}`}
            onClick={() => onFilterChange('Bookmarks')}
          >
            <Bookmark size={16} />
            Bookmarks
          </button>
        </nav>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>TOPICS</h3>
        <nav className={styles.nav}>
          {topics.slice(0, 12).map(topic => (
            <button
              key={topic.slug}
              className={`${styles.topicLink} ${activeTopic === topic.slug ? styles.active : ''}`}
              onClick={() => onTopicChange(topic.slug)}
            >
              {topic.name}
            </button>
          ))}
        </nav>
      </section>
    </aside>
  )
}
