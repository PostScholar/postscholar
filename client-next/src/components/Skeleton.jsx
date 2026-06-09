import styles from './Skeleton.module.css'

export function Skeleton({ width, height, className }) {
  return (
    <div
      className={`${styles.skeleton} ${className || ''}`}
      style={{ width, height }}
    />
  )
}

export function FeedCardSkeleton() {
  return (
    <div className={styles.feedCard}>
      <Skeleton width="80%" height="24px" />
      <div className={styles.meta}>
        <Skeleton width="120px" height="14px" />
        <Skeleton width="100px" height="14px" />
        <Skeleton width="60px" height="14px" />
      </div>
      <div className={styles.footer}>
        <Skeleton width="100px" height="12px" />
        <Skeleton width="80px" height="12px" />
      </div>
    </div>
  )
}

export function PaperHeaderSkeleton() {
  return (
    <div className={styles.paperHeader}>
      <Skeleton width="100px" height="20px" className={styles.badge} />
      <Skeleton width="90%" height="36px" />
      <Skeleton width="60%" height="16px" />
      <div className={styles.meta}>
        <Skeleton width="150px" height="14px" />
        <Skeleton width="100px" height="14px" />
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <Skeleton width="100px" height="14px" />
        <Skeleton width="60px" height="12px" />
      </div>
      <Skeleton width="100%" height="14px" />
      <Skeleton width="95%" height="14px" />
      <Skeleton width="80%" height="14px" />
      <div className={styles.commentActions}>
        <Skeleton width="40px" height="12px" />
        <Skeleton width="50px" height="12px" />
      </div>
    </div>
  )
}
