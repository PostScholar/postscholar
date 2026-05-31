import { useState } from 'react'
import Layout from '../components/Layout'
import FeedCard from '../components/FeedCard'
import styles from './Home.module.css'

/**
 * Mock data — replaced with real API calls in E9
 */
const MOCK_DISCUSSIONS = [
  {
    id: '1',
    paper: {
      title: 'Attention Is All You Need',
      authors: [{ given: 'Ashish', family: 'Vaswani' }, { given: 'Noam', family: 'Shazeer' }],
      journal: 'Advances in Neural Information Processing Systems',
      year: 2017,
    },
    comment_count: 24,
    last_activity: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
  },
  {
    id: '2',
    paper: {
      title: 'Deep Residual Learning for Image Recognition',
      authors: [{ given: 'Kaiming', family: 'He' }, { given: 'Xiangyu', family: 'Zhang' }],
      journal: 'CVPR',
      year: 2016,
    },
    comment_count: 11,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hrs ago
  },
  {
    id: '3',
    paper: {
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      authors: [{ given: 'Jacob', family: 'Devlin' }, { given: 'Ming-Wei', family: 'Chang' }],
      journal: 'NAACL',
      year: 2019,
    },
    comment_count: 0,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: '4',
    paper: {
      title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
      authors: [{ given: 'Alexey', family: 'Dosovitskiy' }],
      journal: 'ICLR',
      year: 2021,
    },
    comment_count: 7,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '5',
    paper: {
      title: 'Language Models are Few-Shot Learners',
      authors: [{ given: 'Tom', family: 'Brown' }, { given: 'Benjamin', family: 'Mann' }],
      journal: 'NeurIPS',
      year: 2020,
    },
    comment_count: 0,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: '6',
    paper: {
      title: 'Generative Adversarial Networks',
      authors: [{ given: 'Ian', family: 'Goodfellow' }, { given: 'Jean', family: 'Pouget-Abadie' }],
      journal: 'NeurIPS',
      year: 2014,
    },
    comment_count: 18,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

const TABS = ['Recent', 'Unanswered']

export default function Home() {
  const [activeTab, setActiveTab] = useState('Recent')

  const filtered = activeTab === 'Unanswered'
    ? MOCK_DISCUSSIONS.filter(d => d.comment_count === 0)
    : MOCK_DISCUSSIONS

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Discussions</h1>
        <p className={styles.subheading}>
          Academic papers, open for discussion.
        </p>
      </div>

      {/* Tab bar */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className={styles.feed}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No unanswered discussions.</p>
        ) : (
          filtered.map(discussion => (
            <FeedCard key={discussion.id} discussion={discussion} />
          ))
        )}
      </div>
    </Layout>
  )
}
