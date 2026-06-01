import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PaperHeader from '../components/PaperHeader'
import CommentThread from '../components/CommentThread'
import PaperSidebar from '../components/PaperSidebar'
import styles from './Discussion.module.css'

/**
 * Discussion page — /d/:id
 *
 * Fetches the discussion by ID (which maps to a paper).
 * Left: paper header + comment thread
 * Right sidebar: paper stats + verification CTA
 *
 * Uses mock data until E9 wires real endpoints.
 */

const MOCK_DISCUSSION = {
  id: '82cb0b8b-9772-43d0-a9e6-64f602f855bd',
  paper: {
    id: '4880e1f4-fa2a-4510-b492-f58d11fba113',
    doi: '10.1145/3290605.3300651',
    title: 'Analyzing the Use of Camera Glasses in the Wild',
    authors_json: [
      { given: 'Taryn', family: 'Bipat' },
      { given: 'Maarten Willem', family: 'Bos' },
      { given: 'Rajan', family: 'Vaish' },
      { given: 'Andrés', family: 'Monroy-Hernández' },
    ],
    journal: 'Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems',
    year: 2019,
    abstract: null,
    source: 'crossref',
  },
  comment_count: 3,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
}

const MOCK_COMMENTS = [
  {
    id: 'c1',
    user_id: 'u1',
    username: 'test1',
    body: 'This is a fascinating paper. The methodology for tracking usage patterns in naturalistic settings is particularly interesting.',
    parent_comment_id: null,
    depth: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    is_verified_author: false,
    replies: [
      {
        id: 'c2',
        user_id: 'u2',
        username: 'ummara',
        body: 'Agreed — I especially liked how they handled privacy concerns in the data collection phase.',
        parent_comment_id: 'c1',
        depth: 1,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        is_verified_author: true,
        replies: [],
      }
    ],
  },
  {
    id: 'c3',
    user_id: 'u3',
    username: 'researcher99',
    body: 'Has anyone looked at replication studies? I would be curious about cross-cultural comparisons.',
    parent_comment_id: null,
    depth: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    is_verified_author: false,
    replies: [],
  },
]

export default function Discussion() {
  const { id } = useParams()
  const [discussion, setDiscussion] = useState(MOCK_DISCUSSION)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [loading, setLoading] = useState(false)

  // In E9 this will fetch from /discussions/:id/comments
  // and /papers/:doi via the discussion id

  const sidebar = (
    <PaperSidebar
      paper={discussion.paper}
      discussionId={discussion.id}
    />
  )

  return (
    <Layout sidebar={sidebar}>
      <PaperHeader paper={discussion.paper} />
      <div className={styles.divider} />
      <CommentThread
        discussionId={discussion.id}
        comments={comments}
        setComments={setComments}
      />
    </Layout>
  )
}
