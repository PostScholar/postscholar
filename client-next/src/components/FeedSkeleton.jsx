export default function FeedSkeleton({ rows = 4 }) {
  return (
    <div className="skeleton-feed" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-meta" />
          <div className="skeleton-line skeleton-metaShort" />
        </div>
      ))}
    </div>
  )
}
