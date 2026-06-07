# PostScholar — Comprehensive UI/UX & Feature Enhancement Proposal

**Prepared**: June 6, 2026
**Platform**: Academic Discussion Platform
**Tech Stack**: Next.js 16, PostgreSQL, Express.js, ORCID OAuth

---

## EXECUTIVE SUMMARY

PostScholar is a well-structured academic discussion platform with solid technical foundations. However, to compete with ResearchGate and Academia.edu, it needs significant UI/UX polish, missing academic features, and enhanced community engagement tools. This proposal outlines a strategic roadmap to transform PostScholar into a professional, trusted academic platform.

---

## SECTION 1: CURRENT STATE ANALYSIS

### 1.1 Existing Features ✅
- **Core Functionality**
  - Paper-centric discussions (DOI-based via CrossRef)
  - Nested comment threads with reply functionality
  - User authentication (email/password)
  - ORCID verification for author badges
  - Topic taxonomy (10 fields, 51 subtopics)
  - Basic search (papers and comments)
  - Sort options (oldest, newest, most replied)
  - Custom tags for discussions
  - User profiles with bio
  - Dark/light theme toggle
  - Responsive design (mobile hamburger menu)

### 1.2 Technical Strengths 💪
- Clean database schema with proper indexing
- Migration-based database management
- JWT authentication with httpOnly cookies
- Server/client separation
  - Well-organized component structure
- CSS Modules for scoped styling
- Fluid typography using clamp()
- Server-side rendering for SEO

### 1.3 Critical Weaknesses & Pain Points 🚨

**UI/UX Issues:**
1. **Visual Hierarchy**: Lacks strong typographic hierarchy on discussion pages
2. **Information Density**: Paper abstracts and metadata not prominently displayed
3. **Engagement Cues**: No visible indicators of discussion activity (view counts, trending, etc.)
4. **Onboarding**: No first-time user guidance or empty states
5. **Visual Feedback**: Limited loading states, error messages could be more helpful
6. **Search UX**: Basic search doesn't highlight matches or show relevance
7. **Mobile Experience**: Some components feel cramped on mobile (comment threading)
8. **Color System**: Accent color (#a04545) is good but lacks a full palette for states
9. **Icons**: Using text symbols (↵, ☾, ☀) instead of proper icon system
10. **Whitespace**: Some pages feel dense (discussion page header)

**Missing Critical Features:**
1. **No notifications system** (replies, mentions, new discussions)
2. **No bookmarking/saving** discussions or papers
3. **No upvoting/downvoting** on comments (quality signal)
4. **No user reputation system**
5. **No moderation tools** (report, flag, hide)
6. **No email digests** (weekly summaries, trending papers)
7. **No RSS feeds** for topics or users
8. **No citation formatting** (APA, MLA, Chicago, BibTeX)
9. **No paper metrics** (citations, Altmetric, impact factor)
10. **No following users or topics**
11. **No "recommended for you"** algorithmfeature
12. **No discussion analytics** for authors
13. **No API for researchers**
14. **No LaTeX/math support** in comments
15. **No file attachments** (supplementary materials, datasets)

**Technical Debt:**
1. No pagination on explore feed (loads all discussions)
2. No rate limiting on API endpoints
3. No input sanitization (XSS vulnerability)
4. No comprehensive error boundaries
5. No analytics/telemetry
6. No A/B testing framework
7. No automated testing for frontend
8. Missing updated_at on comments (added but not in schema migration)

---

## SECTION 2: UI/UX IMPROVEMENTS

### 2.1 Visual Design Enhancements

#### 2.1.1 Color System Expansion
**Current**: Single accent color (#a04545)
**Proposed**: Full semantic color palette

```css
/* Semantic Colors */
--accent-primary: #a04545;      /* Main red */
--accent-hover: #8a3838;         /* Darker red */
--accent-subtle: rgba(160, 69, 69, 0.08);

/* Success */
--success: #2d7a5e;
--success-bg: rgba(45, 122, 94, 0.08);

/* Warning */
--warning: #d97706;
--warning-bg: rgba(217, 119, 6, 0.08);

/* Info */
--info: #2563eb;
--info-bg: rgba(37, 99, 235, 0.08);

/* Quality Signals */
--upvote: #10b981;
--downvote: #ef4444;

/* Badge variations */
--badge-author: #a04545;
--badge-moderator: #7c3aed;
--badge-verified: #0891b2;
```

#### 2.1.2 Typography Scale Refinement
**Issue**: Current scale works but needs better semantic naming

```css
/* Refined Scale */
--text-display: clamp(2rem, 4vw, 3rem);      /* Hero headings */
--text-h1: clamp(1.75rem, 3vw, 2.25rem);    /* Page titles */
--text-h2: clamp(1.35rem, 2vw, 1.65rem);     /* Section headings */
--text-h3: clamp(1.15rem, 1.5vw, 1.35rem);   /* Card titles */
--text-body-lg: clamp(1rem, 1.2vw, 1.125rem);
--text-body: clamp(0.95rem, 1vw, 1rem);
--text-body-sm: clamp(0.875rem, 0.9vw, 0.9375rem);
--text-caption: clamp(0.75rem, 0.8vw, 0.8125rem);
```

#### 2.1.3 Spacing System
**Current**: Uses --space-1 through --space-8
**Proposed**: Add component-specific spacing tokens

```css
/* Component Spacing */
--spacing-card-padding: var(--space-5);
--spacing-section-gap: var(--space-12);
--spacing-inline-gap: var(--space-3);
--spacing-stack-tight: var(--space-2);
--spacing-stack-normal: var(--space-4);
--spacing-stack-loose: var(--space-8);
```

#### 2.1.4 Icon System
**Current**: Text symbols (☾, ☀, ↵)
**Proposed**: Integrate **Lucide React** or **Heroicons**

Benefits:
- Professional appearance
- Better accessibility
- Consistent sizing
- More expressive UI

Icons needed:
- Search, Filter, Sort
- Bookmark, Share, Link
- Upvote, Downvote
- Reply, Edit, Delete
- User, Settings, Bell (notifications)
- Sun, Moon (theme)
- ChevronDown, ChevronUp
- Check, X, Info, Warning
- ExternalLink, Copy
- Menu, X (mobile)

### 2.2 Component Library Improvements

#### 2.2.1 Button Variants
**Current**: Only primary, outlined, and text buttons
**Proposed**: Full button system

```jsx
// Primary (filled)
<Button variant="primary">Post comment</Button>

// Secondary (outlined)
<Button variant="secondary">Cancel</Button>

// Ghost (text only)
<Button variant="ghost">Edit</Button>

// Danger
<Button variant="danger">Delete</Button>

// With icon
<Button icon={<BookmarkIcon />}>Save</Button>

// Icon only
<IconButton icon={<ShareIcon />} label="Share" />

// Loading state
<Button loading>Posting...</Button>
```

#### 2.2.2 Input Components
**Missing**: No shared Input, Select, or Textarea components

```jsx
// Standardized Input
<Input
  label="Email"
  type="email"
  error="Invalid email"
  hint="We'll never share your email"
  required
/>

// Select with search
<Select
  label="Field"
  options={fields}
  searchable
  placeholder="Select a field..."
/>

// Textarea with character count
<Textarea
  label="Comment"
  maxLength={5000}
  showCount
  rows={4}
/>
```

#### 2.2.3 Card Component
**Current**: FeedCard is specific
**Proposed**: Generic Card component

```jsx
<Card variant="elevated" hoverable>
  <Card.Header>
    <Card.Title>Discussion Title</Card.Title>
    <Card.Meta>Posted 2h ago</Card.Meta>
  </Card.Header>
  <Card.Body>
    Content here
  </Card.Body>
  <Card.Footer>
    Actions here
  </Card.Footer>
</Card>
```

#### 2.2.4 Empty States
**Missing**: No empty state components

```jsx
<EmptyState
  icon={<SearchIcon />}
  title="No results found"
  description="Try adjusting your search terms"
  action={<Button onClick={clearSearch}>Clear search</Button>}
/>
```

### 2.3 Layout Improvements

#### 2.3.1 Landing Page Redesign
**Current**: Simple hero + stats + CTA
**Proposed**: Multi-section marketing page

```
[Hero Section]
- Headline: "Where research meets discussion"
- Subhead: "Join scholars worldwide in meaningful conversations about published research"
- CTA: "Start a discussion" + "Explore discussions"
- Visual: Animated illustration or screenshot

[Features Section]
- 3-column grid:
  1. "Verify your authorship" (ORCID badge visual)
  2. "Discuss published research" (Paper + comments visual)
  3. "Build your academic presence" (Profile visual)

[Stats Bar] (current)
- 10 fields, 51 topics, ORCID verified

[How It Works]
1. Search for a paper (DOI)
2. Start or join a discussion
3. Engage with verified authors
(with visual flow diagram)

[Recent Discussions] (removed but should return)
- 5 latest discussions with author badges
- "View all discussions" CTA

[Footer]
- About, Contact, Terms, Privacy
- Social links (Twitter, GitHub)
```

#### 2.3.2 Discussion Page Layout
**Current**: Paper header + sidebar with metadata
**Issues**:
- Abstract hidden (must expand)
- Authors list not prominent
- No metrics shown
- Sidebar feels empty

**Proposed Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [← Discussions]                    [Bookmark] [Share]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Paper Title (Large, prominent)                          │
│ Authors (with ORCID icons if available)                 │
│ Journal • Year • DOI link                               │
│                                                          │
│ [Show Abstract ▼]                                       │
│                                                          │
│ Topics: [Neuroscience] [fMRI] [Visual Cortex]          │
│                                                          │
├────────────────────────────────┬────────────────────────┤
│                                │  SIDEBAR               │
│ [Search comments...]           │                        │
│                                │  📊 Discussion Stats   │
│ [12 comments] [Sort: Oldest ▼] │  • 12 comments         │
│                                │  • 247 views           │
│ ┌──────────────────────────┐  │  • Started 3d ago      │
│ │ [Add a comment...]       │  │                        │
│ │ [Post comment]           │  │  📄 Paper Info         │
│ └──────────────────────────┘  │  • Cited by: 42        │
│                                │  • Altmetric: 8        │
│ [Comment 1]                    │  • [Export citation▼]  │
│   Reply Edit Delete            │                        │
│   └─ [Reply 1]                 │  ✓ Are you an author?  │
│                                │  [Verify with ORCID]   │
│ [Comment 2]                    │                        │
│                                │  🔔 Follow             │
│                                │  Get notified of       │
│                                │  new comments          │
└────────────────────────────────┴────────────────────────┘
```

Key changes:
1. Abstract collapsed by default (show/hide toggle)
2. Authors more prominent with ORCID links
3. Discussion stats sidebar widget (views, comment count)
4. Paper metrics (citations, Altmetric)
5. Export citation dropdown
6. Follow discussion toggle
7. Bookmark and Share actions in header

#### 2.3.3 Explore Feed Layout
**Current**: Simple list with filters
**Proposed**: Grid + list toggle, better filters

```
┌─────────────────────────────────────────────────────────┐
│ Explore Discussions                                      │
│                                                          │
│ [Search...]  [Field: All ▼] [Sort: Recent ▼] [Grid/List]│
│                                                          │
│ ┌─────────────┬─────────────┬─────────────┐            │
│ │ [Card 1]    │ [Card 2]    │ [Card 3]    │            │
│ │ Paper title │ Paper title │ Paper title │            │
│ │ Authors...  │ Authors...  │ Authors...  │            │
│ │ 12 comments │ 5 comments  │ 23 comments │            │
│ │ 2h ago      │ 5h ago      │ 1d ago      │            │
│ │ [Topics]    │ [Topics]    │ [Topics]    │            │
│ └─────────────┴─────────────┴─────────────┘            │
│                                                          │
│ [Load more]                                             │
└─────────────────────────────────────────────────────────┘
```

Features:
- Grid view option (3 columns on desktop)
- List view (current)
- Better card hierarchy
- Hover effects
- "Trending" and "New" badges

#### 2.3.4 User Profile Enhancement
**Current**: Basic profile with discussions/comments tabs
**Proposed**: Rich profile with stats

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]                                    [Edit profile]│
├─────────────────────────────────────────────────────────┤
│ [Avatar]  username                                       │
│           Affiliation • Location                         │
│           Joined June 2026                               │
│                                                          │
│ Bio text here...                                         │
│                                                          │
│ 🔗 Website • ORCID • Google Scholar • Twitter           │
│                                                          │
│ ┌──────────┬──────────┬──────────┐                     │
│ │ 12       │ 145      │ 3        │                     │
│ │ Discussions│ Comments │ Verified │                   │
│ └──────────┴──────────┴──────────┘                     │
│                                                          │
│ [Discussions] [Comments] [Bookmarks] [Followers]         │
│                                                          │
│ [Content based on tab...]                               │
└─────────────────────────────────────────────────────────┘
```

New fields:
- Affiliation (university/institution)
- Location
- Website URL
- Google Scholar link
- Twitter handle
- Stats cards (discussions, comments, verifications)
- Followers/Following counts
- Bookmarks tab (saved discussions)

### 2.4 Accessibility Improvements

**Critical Missing Items**:
1. **Focus indicators**: Not visible on all interactive elements
2. **Skip links**: No "Skip to main content"
3. **ARIA labels**: Missing on icon buttons
4. **Keyboard navigation**: Dropdown menus not fully keyboard accessible
5. **Screen reader**: Empty state content not announced
6. **Color contrast**: Some text-muted colors may fail WCAG AA
7. **Form errors**: Not programmatically associated with inputs
8. **Loading states**: No aria-live regions

**Action Items**:
```jsx
// Add skip link
<a href="#main" className="skip-link">Skip to main content</a>

// Fix icon buttons
<button aria-label="Toggle theme">
  <MoonIcon aria-hidden="true" />
</button>

// Improve focus indicators
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

// Add live regions
<div role="status" aria-live="polite" aria-atomic="true">
  {loading ? 'Loading comments...' : ''}
</div>
```

### 2.5 Responsive Design Refinements

**Mobile Issues**:
1. Comment threading indentation too aggressive on mobile
2. Paper title truncates awkwardly
3. Sidebar pushes content below fold
4. Topic pills wrap messily
5. Search bar in nav takes too much space

**Tablet Issues**:
1. Sidebar at 280px feels cramped (should be 300-320px)
2. Two-column grid on explore could work better

**Proposed Breakpoints**:
```css
/* Current: Just 640px, 768px */
/* Proposed: */
--breakpoint-xs: 375px;   /* Small phones */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

---

## SECTION 3: FEATURE ENHANCEMENTS

### 3.1 Critical Missing Features (High Priority)

#### 3.1.1 Notifications System
**Why**: Users can't track replies, mentions, or new activity
**Implementation**:

**Database Schema**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'mention', 'verification', 'new_discussion')),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at);
```

**UI Component**:
```jsx
// Nav bell icon with unread count
<IconButton onClick={openNotifications}>
  <BellIcon />
  {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
</IconButton>

// Notification panel
<NotificationPanel>
  <Notification
    type="reply"
    actor="user123"
    message="replied to your comment"
    time="2h ago"
    read={false}
    onClick={goToComment}
  />
</NotificationPanel>
```

**Email Notifications** (optional):
- Immediate for @mentions
- Digest mode (daily/weekly) for other activity

#### 3.1.2 Bookmarking/Saving
**Why**: Users want to save interesting discussions for later

**Database Schema**:
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, discussion_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at);
```

**UI**:
```jsx
// Bookmark button on discussion page
<IconButton onClick={toggleBookmark} title="Save">
  {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
</IconButton>

// User profile tab
<Tab label="Bookmarks">
  {bookmarks.map(b => <FeedCard key={b.id} {...b} />)}
</Tab>
```

#### 3.1.3 Comment Voting (Upvote/Downvote)
**Why**: Surface high-quality comments, reduce noise

**Database Schema**:
```sql
CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comments ADD COLUMN score INTEGER DEFAULT 0;

CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comments_score ON comments(score DESC);
```

**UI**:
```jsx
<Comment>
  <VoteButtons>
    <IconButton onClick={() => vote(1)} active={userVote === 1}>
      <ArrowUpIcon />
    </IconButton>
    <span>{score}</span>
    <IconButton onClick={() => vote(-1)} active={userVote === -1}>
      <ArrowDownIcon />
    </IconButton>
  </VoteButtons>
  <CommentBody>...</CommentBody>
</Comment>
```

**Sort option**: Add "Top" (by score) to comment sort dropdown

#### 3.1.4 Moderation Tools
**Why**: Community health, spam prevention

**Database Schema**:
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'offtopic', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
ALTER TABLE comments ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
```

**UI**:
```jsx
// Report button in comment actions
<IconButton onClick={openReportModal}>
  <FlagIcon /> Report
</IconButton>

// Moderator view (if user.role === 'moderator')
<ModDashboard>
  <ReportQueue>
    {reports.map(r => (
      <ReportCard
        key={r.id}
        reason={r.reason}
        description={r.description}
        onDismiss={dismiss}
        onHideComment={hide}
        onBanUser={ban}
      />
    ))}
  </ReportQueue>
</ModDashboard>
```

#### 3.1.5 Citation Export
**Why**: Academics need proper citation formatting

**Implementation** (client-side):
```jsx
import { format } from 'citation-js'

function exportCitation(paper, style) {
  const citation = new Cite(paper)
  return citation.format('bibliography', {
    format: 'text',
    template: style, // 'apa', 'mla', 'chicago', 'bibtex'
    lang: 'en-US'
  })
}

// UI
<Dropdown label="Export citation">
  <DropdownItem onClick={() => copy(exportCitation(paper, 'apa'))}>
    APA
  </DropdownItem>
  <DropdownItem onClick={() => copy(exportCitation(paper, 'mla'))}>
    MLA
  </DropdownItem>
  <DropdownItem onClick={() => copy(exportCitation(paper, 'bibtex'))}>
    BibTeX
  </DropdownItem>
</Dropdown>
```

### 3.2 Engagement Features (Medium Priority)

#### 3.2.1 Following System
**Database Schema**:
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**UI**:
```jsx
// User profile
<Button onClick={toggleFollow}>
  {isFollowing ? 'Unfollow' : 'Follow'}
</Button>

// Following feed (new page: /following)
<FollowingFeed>
  {activities.map(a => (
    <ActivityCard
      user={a.user}
      action={a.action} // "started a discussion", "commented on"
      discussion={a.discussion}
      time={a.time}
    />
  ))}
</FollowingFeed>
```

#### 3.2.2 Topic Following
**Database Schema**:
```sql
CREATE TABLE topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);
```

**UI**:
```jsx
// Topic page
<TopicHeader topic={topic}>
  <Button onClick={toggleFollowTopic}>
    {isFollowing ? 'Following' : 'Follow'}
  </Button>
</TopicHeader>

// User gets notified of new discussions in followed topics
```

#### 3.2.3 @Mentions
**Implementation**:
```jsx
// Comment textarea with mention autocomplete
<MentionTextarea
  value={body}
  onChange={setBody}
  suggestions={users} // Search users as you type
  trigger="@"
/>

// Parse mentions on submit
function parseMentions(text) {
  const regex = /@(\w+)/g
  return text.match(regex) || []
}

// Create notification for mentioned users
mentions.forEach(username => {
  createNotification({
    user: username,
    type: 'mention',
    actor: currentUser,
    comment: newComment
  })
})
```

#### 3.2.4 Share Functionality
**UI**:
```jsx
<ShareButton discussion={discussion}>
  <ShareOption icon={<LinkIcon />} onClick={copyLink}>
    Copy link
  </ShareOption>
  <ShareOption icon={<TwitterIcon />} onClick={shareTwitter}>
    Share on Twitter
  </ShareOption>
  <ShareOption icon={<MailIcon />} onClick={shareEmail}>
    Share via email
  </ShareOption>
</ShareButton>
```

### 3.3 Academic-Specific Features (High Priority)

#### 3.3.1 Paper Metrics Integration
**API Integration**:
- **OpenCitations** (free, citation counts)
- **Altmetric API** (social media mentions, news coverage)
- **Semantic Scholar** (influential citations, tldr summaries)

**Implementation**:
```js
// server/routes/papers.js
async function getPaperMetrics(doi) {
  const [citations, altmetric] = await Promise.all([
    fetch(`https://opencitations.net/index/api/v1/citations/${doi}`),
    fetch(`https://api.altmetric.com/v1/doi/${doi}`)
  ])

  return {
    citationCount: citations?.length || 0,
    altmetricScore: altmetric?.score || 0,
    mentions: {
      news: altmetric?.news || 0,
      twitter: altmetric?.twitter || 0,
      blogs: altmetric?.blogs || 0
    }
  }
}
```

**UI (Paper sidebar)**:
```jsx
<MetricsWidget>
  <Metric label="Citations" value={42} />
  <Metric label="Altmetric" value={8} badge="donut" />
  <Metric label="News mentions" value={3} />
</MetricsWidget>
```

#### 3.3.2 LaTeX/Math Support
**Library**: KaTeX (faster than MathJax)

**Implementation**:
```jsx
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'

// In comment body rendering
<CommentBody>
  <Latex>{comment.body}</Latex>
</CommentBody>

// Example usage in comment:
// "The equation $E = mc^2$ shows..."
// Or block: $$\int_{a}^{b} f(x) dx$$
```

**UI Enhancement**:
```jsx
// Toolbar for comment input
<CommentToolbar>
  <IconButton title="Insert equation" onClick={openLatexHelper}>
    <FunctionIcon />
  </IconButton>
</CommentToolbar>

// LaTeX helper modal
<LatexModal>
  <Input placeholder="Enter LaTeX..." value={latex} />
  <Preview><Latex>{latex}</Latex></Preview>
  <Button onClick={insertLatex}>Insert</Button>
</LatexModal>
```

#### 3.3.3 Author Profiles (ORCID Integration)
**Enhancement**: Fetch author data from ORCID API

```js
async function getORCIDProfile(orcid) {
  const response = await fetch(`https://pub.orcid.org/v3.0/${orcid}`, {
    headers: { Accept: 'application/json' }
  })
  const data = await response.json()

  return {
    name: data.person.name,
    affiliation: data.activities.employments[0]?.organization?.name,
    publications: data.activities.works.total
  }
}
```

**UI (when viewing verified author's profile)**:
```jsx
<ORCIDCard>
  <ORCIDLogo />
  <h3>{profile.name}</h3>
  <p>{profile.affiliation}</p>
  <p>{profile.publications} publications</p>
  <a href={`https://orcid.org/${orcid}`}>View ORCID profile</a>
</ORCIDCard>
```

#### 3.3.4 Paper Recommendations
**Algorithm** (simple collaborative filtering):
```js
// Find similar discussions based on:
// 1. Same authors
// 2. Same topics/subtopics
// 3. Users who commented here also commented there
async function getRecommendedDiscussions(discussionId, limit = 5) {
  const sql = `
    WITH current_discussion AS (
      SELECT paper_id, topic_id FROM discussions
      WHERE id = $1
    )
    SELECT d.*,
      COUNT(DISTINCT c.user_id) as overlap_users,
      similarity_score
    FROM discussions d
    JOIN papers p ON d.paper_id = p.id
    LEFT JOIN comments c ON d.id = c.discussion_id
    WHERE d.id != $1
    AND (
      p.authors_json ?| (SELECT authors_json FROM papers WHERE id = (SELECT paper_id FROM current_discussion))
      OR d.topic_id = (SELECT topic_id FROM current_discussion)
      OR c.user_id IN (SELECT user_id FROM comments WHERE discussion_id = $1)
    )
    GROUP BY d.id
    ORDER BY overlap_users DESC, similarity_score DESC
    LIMIT $2
  `
  return await pool.query(sql, [discussionId, limit])
}
```

**UI (discussion sidebar)**:
```jsx
<RecommendedWidget>
  <h3>Related discussions</h3>
  {recommended.map(d => (
    <MiniCard key={d.id} discussion={d} />
  ))}
</RecommendedWidget>
```

### 3.4 Search & Discovery (Medium Priority)

#### 3.4.1 Advanced Search
**Current**: Basic text search
**Proposed**: Multi-field search with filters

**UI**:
```jsx
<AdvancedSearch>
  <Input placeholder="Search discussions, papers, users..." />

  <Filters>
    <Select label="Field" options={fields} />
    <Select label="Year" options={years} />
    <Checkbox label="Only verified authors" />
    <Checkbox label="Has > 10 comments" />
  </Filters>

  <SearchResults>
    <Tabs>
      <Tab label="Discussions">...</Tab>
      <Tab label="Comments">...</Tab>
      <Tab label="Users">...</Tab>
    </Tabs>
  </SearchResults>
</AdvancedSearch>
```

**Search Ranking**:
```sql
-- Use PostgreSQL full-text search
ALTER TABLE papers ADD COLUMN search_vector tsvector;
UPDATE papers SET search_vector =
  to_tsvector('english', title || ' ' || COALESCE(abstract, ''));
CREATE INDEX idx_papers_search ON papers USING GIN(search_vector);

-- Search query
SELECT *, ts_rank(search_vector, query) as rank
FROM papers, plainto_tsquery('neuroscience') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

#### 3.4.2 Trending Discussions
**Algorithm**:
```js
// Trending score = (comments + views) / age_in_hours^1.5
async function getTrendingDiscussions(limit = 10) {
  const sql = `
    SELECT d.*,
      COUNT(c.id) as comment_count,
      v.view_count,
      (COUNT(c.id) + COALESCE(v.view_count, 0)) /
        POWER(EXTRACT(EPOCH FROM NOW() - d.created_at) / 3600, 1.5) as trending_score
    FROM discussions d
    LEFT JOIN comments c ON d.id = c.discussion_id
    LEFT JOIN discussion_views v ON d.id = v.discussion_id
    WHERE d.created_at > NOW() - INTERVAL '7 days'
    GROUP BY d.id, v.view_count
    ORDER BY trending_score DESC
    LIMIT $1
  `
  return await pool.query(sql, [limit])
}
```

**UI (homepage or explore)**:
```jsx
<TrendingSection>
  <h2>🔥 Trending this week</h2>
  <TrendingList>
    {trending.map(d => <TrendingCard key={d.id} {...d} />)}
  </TrendingList>
</TrendingSection>
```

### 3.5 User Engagement (Low Priority)

#### 3.5.1 Weekly Digest Email
**Content**:
- Top 5 discussions in followed topics
- Replies to your comments
- New discussions from followed users

**Implementation** (cron job):
```js
// server/jobs/weeklyDigest.js
const nodemailer = require('nodemailer')

async function sendWeeklyDigest() {
  const users = await getActiveUsers()

  for (const user of users) {
    const digest = await generateDigest(user.id)
    await sendEmail({
      to: user.email,
      subject: 'Your weekly PostScholar digest',
      html: renderDigestEmail(digest)
    })
  }
}

// Run every Monday at 9am
cron.schedule('0 9 * * 1', sendWeeklyDigest)
```

#### 3.5.2 User Reputation System
**Score calculation**:
```
reputation =
  (discussions_started * 5) +
  (comments_posted * 2) +
  (upvotes_received * 3) +
  (verified_authorships * 50)
```

**Database**:
```sql
ALTER TABLE users ADD COLUMN reputation INTEGER DEFAULT 0;

-- Update reputation trigger
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET reputation = (
    (SELECT COUNT(*) FROM discussions WHERE created_by = NEW.id) * 5 +
    (SELECT COUNT(*) FROM comments WHERE user_id = NEW.id) * 2 +
    (SELECT SUM(score) FROM comments WHERE user_id = NEW.id) * 3 +
    (SELECT COUNT(*) FROM author_verifications WHERE user_id = NEW.id) * 50
  ) WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**UI (user profile)**:
```jsx
<ReputationBadge score={user.reputation}>
  <FireIcon /> {user.reputation} reputation
</ReputationBadge>
```

---

## SECTION 4: TECHNICAL IMPROVEMENTS

### 4.1 Security Enhancements

#### 4.1.1 Input Sanitization (CRITICAL)
**Issue**: XSS vulnerability in comment bodies

**Fix**:
```js
const sanitizeHtml = require('sanitize-html')

function sanitizeComment(body) {
  return sanitizeHtml(body, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'code', 'pre'],
    allowedAttributes: {
      a: ['href', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  })
}

// In POST /discussions/:id/comments
const sanitizedBody = sanitizeComment(req.body.body)
```

#### 4.1.2 Rate Limiting
**Implementation**:
```js
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter for login/register
  skipSuccessfulRequests: true
})

app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
```

#### 4.1.3 CSRF Protection
```js
const csrf = require('csurf')
const csrfProtection = csrf({ cookie: true })

app.use(csrfProtection)

// Send token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Client includes token in requests
fetch('/api/discussions', {
  method: 'POST',
  headers: {
    'CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
})
```

### 4.2 Performance Optimizations

#### 4.2.1 Database Indexing Audit
**Missing Indexes**:
```sql
-- Add missing indexes
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_papers_title_trgm ON papers USING gin (title gin_trgm_ops);
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
```

#### 4.2.2 Query Optimization
**N+1 Problem** in explore feed:

**Current**:
```js
const discussions = await getDiscussions()
for (const d of discussions) {
  d.commentCount = await getCommentCount(d.id) // N+1!
}
```

**Fixed**:
```sql
SELECT d.*,
  COUNT(c.id) as comment_count,
  p.title, p.authors_json
FROM discussions d
LEFT JOIN comments c ON d.id = c.discussion_id
JOIN papers p ON d.paper_id = p.id
GROUP BY d.id, p.id
ORDER BY d.created_at DESC
LIMIT 20
```

#### 4.2.3 Response Caching
```js
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 600 }) // 10 min default

app.get('/api/discussions/:id/paper', async (req, res) => {
  const cacheKey = `discussion:${req.params.id}`
  const cached = cache.get(cacheKey)

  if (cached) return res.json(cached)

  const data = await getDiscussionData(req.params.id)
  cache.set(cacheKey, data)
  res.json(data)
})
```

#### 4.2.4 Image Optimization
**User avatars**:
- Use CDN (Cloudinary, imgix)
- Generate thumbnails (50x50, 200x200)
- Lazy load avatars below fold
- Use WebP format with JPEG fallback

```jsx
<Image
  src={avatar}
  alt={username}
  width={50}
  height={50}
  loading="lazy"
  quality={75}
  format="webp"
/>
```

### 4.3 Code Quality Improvements

#### 4.3.1 Error Boundaries
**Missing**: Frontend error handling

```jsx
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to error tracking service (Sentry)
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error.message}
          action={<Button onClick={() => window.location.reload()}>
            Reload page
          </Button>}
        />
      )
    }
    return this.props.children
  }
}

// app/layout.js
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

#### 4.3.2 API Error Handling
**Current**: Inconsistent error responses
**Proposed**: Standardized error format

```js
// server/middleware/errorHandler.js
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'

  // Log error
  console.error(`[${code}]`, err)

  res.status(statusCode).json({
    error: {
      code,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}

app.use(errorHandler)

// Usage
throw new APIError('Discussion not found', 404, 'DISCUSSION_NOT_FOUND')
```

#### 4.3.3 Input Validation
**Use Zod for schema validation**:

```js
const { z } = require('zod')

const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  parentCommentId: z.string().uuid().optional()
})

app.post('/api/discussions/:id/comments', async (req, res) => {
  try {
    const data = createCommentSchema.parse(req.body)
    // ... create comment
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: err.errors
        }
      })
    }
    throw err
  }
})
```

#### 4.3.4 Frontend Testing
**Missing**: No component tests

```jsx
// __tests__/FeedCard.test.jsx
import { render, screen } from '@testing-library/react'
import FeedCard from '@/components/FeedCard'

describe('FeedCard', () => {
  const mockDiscussion = {
    id: '123',
    title: 'Test Paper',
    authors: [{ given: 'John', family: 'Doe' }],
    commentCount: 5,
    createdAt: '2026-06-01T00:00:00Z'
  }

  it('renders discussion title', () => {
    render(<FeedCard discussion={mockDiscussion} />)
    expect(screen.getByText('Test Paper')).toBeInTheDocument()
  })

  it('shows comment count', () => {
    render(<FeedCard discussion={mockDiscussion} />)
    expect(screen.getByText('5 comments')).toBeInTheDocument()
  })
})
```

### 4.4 Database Schema Improvements

#### 4.4.1 Add updated_at Columns
```sql
-- Add updated_at to all tables
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE discussions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER discussions_updated_at BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 4.4.2 Add View Tracking
```sql
CREATE TABLE discussion_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discussion_views_discussion ON discussion_views(discussion_id);

-- Materialized view for counts
CREATE MATERIALIZED VIEW discussion_view_counts AS
SELECT discussion_id, COUNT(DISTINCT COALESCE(user_id::text, ip_address::text)) as view_count
FROM discussion_views
GROUP BY discussion_id;

CREATE UNIQUE INDEX idx_discussion_view_counts_discussion ON discussion_view_counts(discussion_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY discussion_view_counts;
```

---

## SECTION 5: IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (2-3 weeks)
**Priority**: High impact, low effort

1. **UI Polish** (5 days)
   - ✅ Icon system integration (Lucide React)
   - ✅ Button component variants
   - ✅ Empty state components
   - ✅ Loading skeleton screens
   - ✅ Focus indicators and skip links
   - ✅ Color system expansion

2. **Critical Features** (8 days)
   - ✅ Comment voting (upvote/downvote)
   - ✅ Bookmark/save discussions
   - ✅ Citation export dropdown
   - ✅ updated_at schema migration
   - ✅ Basic moderation (report button)

3. **Security** (3 days)
   - ✅ Input sanitization (sanitize-html)
   - ✅ Rate limiting
   - ✅ Input validation (Zod schemas)
   - ✅ CSRF protection

**Deliverables**:
- Professional UI with consistent design system
- Core engagement features (voting, bookmarking)
- Secured API endpoints
- Better accessibility

---

### Phase 2: Core Features (4-6 weeks)
**Priority**: Essential for platform growth

1. **Notifications System** (10 days)
   - Database schema
   - Backend API (create, mark read, delete)
   - Frontend UI (bell icon, notification panel)
   - Email notifications (immediate + digest)

2. **Advanced Search** (7 days)
   - Full-text search with PostgreSQL
   - Multi-field filters (field, year, author)
   - Search result tabs (discussions, comments, users)
   - Highlighting and relevance scoring

3. **Paper Metrics** (5 days)
   - OpenCitations API integration
   - Altmetric API integration
   - Metrics display in sidebar
   - Caching strategy

4. **Moderation Dashboard** (8 days)
   - Reports queue UI
   - Moderator actions (hide, warn, ban)
   - User roles (user, moderator, admin)
   - Audit log

5. **User Profiles Enhanced** (5 days)
   - Affiliation, location, website fields
   - Stats cards (discussions, comments, verifications)
   - Bookmarks tab
   - ORCID profile integration

**Deliverables**:
- Complete notification system
- Powerful search and discovery
- Professional paper metrics
- Moderation tools for community health
- Rich user profiles

---

### Phase 3: Advanced Features (6-8 weeks)
**Priority**: Differentiation, competitive advantage

1. **Following System** (8 days)
   - Follow users
   - Follow topics
   - Following feed (/following page)
   - Activity notifications

2. **@Mentions** (5 days)
   - Mention autocomplete in comments
   - Parse and link mentions
   - Mention notifications

3. **LaTeX/Math Support** (4 days)
   - KaTeX integration
   - LaTeX helper modal
   - Syntax highlighting for code blocks
   - Preview mode for comments

4. **Recommendations** (7 days)
   - "Related discussions" algorithm
   - "Recommended for you" personalized feed
   - Trending discussions
   - Topic-based recommendations

5. **Email Digests** (6 days)
   - Weekly digest email template
   - User preferences (frequency, topics)
   - Cron job setup
   - Unsubscribe flow

6. **Analytics Dashboard** (8 days)
   - View tracking
   - Discussion analytics (views, comments over time)
   - User analytics (reputation, activity)
   - Admin dashboard

7. **Reputation System** (5 days)
   - Reputation calculation
   - Reputation badges/levels
   - Leaderboard
   - Display on profiles

**Deliverables**:
- Social features (following, mentions)
- Academic features (LaTeX, recommendations)
- Engagement tools (digests, analytics)
- Gamification (reputation)

---

### Phase 4: Polish & Scale (4-6 weeks)
**Priority**: Production readiness, growth

1. **Performance** (10 days)
   - Database query optimization
   - Response caching (Redis)
   - CDN for static assets
   - Image optimization
   - Pagination everywhere
   - Lazy loading

2. **Testing** (8 days)
   - Frontend component tests (Jest + RTL)
   - E2E tests (Playwright)
   - API integration tests
   - Load testing

3. **Monitoring** (5 days)
   - Error tracking (Sentry)
   - Analytics (PostHog or Mixpanel)
   - Uptime monitoring
   - Performance monitoring (Web Vitals)

4. **Documentation** (5 days)
   - API documentation (OpenAPI/Swagger)
   - User guide
   - FAQ
   - About page

5. **Mobile App** (12 days) [OPTIONAL]
   - React Native app
   - Share core logic with web
   - Push notifications
   - Offline support

**Deliverables**:
- Production-ready platform
- Comprehensive test coverage
- Observability and monitoring
- Documentation
- [Optional] Mobile app

---

## SECTION 6: SPECIFIC UI MOCKUPS/DESCRIPTIONS

### 6.1 Landing Page Redesign

```
╔═══════════════════════════════════════════════════════╗
║ [PostScholar]          [Explore] [Sign in] [Register] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║           🎓 Where research meets discussion           ║
║                                                        ║
║   Join scholars worldwide in meaningful conversations ║
║              about published research                  ║
║                                                        ║
║     [Start a discussion]  [Explore discussions]       ║
║                                                        ║
║   [Illustration: Papers + Speech bubbles + Network]   ║
║                                                        ║
╠═══════════════════════════════════════════════════════╣
║                   HOW IT WORKS                         ║
║  ┌─────────┐   ┌─────────┐   ┌─────────┐            ║
║  │ 1. Find │ → │2.Discuss│ → │3. Connect│            ║
║  │ papers  │   │research │   │w/authors │            ║
║  └─────────┘   └─────────┘   └─────────┘            ║
╠═══════════════════════════════════════════════════════╣
║                    FEATURES                            ║
║  ┌──────────────┬───────────────┬─────────────────┐  ║
║  │ ✓ Verify via│ 📄 Discuss    │ 👥 Build your   │  ║
║  │   ORCID      │    published  │    academic     │  ║
║  │              │    papers     │    presence     │  ║
║  └──────────────┴───────────────┴─────────────────┘  ║
╠═══════════════════════════════════════════════════════╣
║              TRENDING THIS WEEK 🔥                     ║
║  [Card] [Card] [Card] [Card] [Card]                   ║
║                                                        ║
║               [View all discussions →]                 ║
╠═══════════════════════════════════════════════════════╣
║             BY THE NUMBERS                             ║
║    10 fields • 51 topics • ORCID verified             ║
╠═══════════════════════════════════════════════════════╣
║ About • Terms • Privacy         © 2026 PostScholar    ║
╚═══════════════════════════════════════════════════════╝
```

**Key Elements**:
- Clear value proposition
- Visual flow diagram
- Feature highlights with icons
- Trending discussions preview
- Stats bar
- Clean footer

---

### 6.2 Discussion Page (Enhanced)

```
╔═══════════════════════════════════════════════════════════╗
║ [← Discussions]               [🔖 Save] [🔗 Share]        ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║ Neural mechanisms of visual attention in the primate      ║
║ visual cortex                                              ║
║                                                            ║
║ John Doe ¹, Jane Smith ², ... (+5)                        ║
║ ¹MIT, ²Stanford                                           ║
║                                                            ║
║ Nature Neuroscience • 2025 • DOI: 10.1038/nn.xxxx        ║
║                                                            ║
║ [Show Abstract ▼]                                         ║
║                                                            ║
║ Topics: [Neuroscience] [fMRI] [Visual Cortex]            ║
║                                                            ║
╠═══════════════════════════════╦═══════════════════════════╣
║                                ║ 📊 DISCUSSION STATS       ║
║ [🔍 Search comments...]        ║                           ║
║                                ║ • 12 comments             ║
║ 12 comments  [Sort: Top ▼]     ║ • 247 views               ║
║                                ║ • Started 3 days ago      ║
║ ┌──────────────────────────┐  ║                           ║
║ │ Add a comment...         │  ║ 📄 PAPER METRICS          ║
║ │                          │  ║                           ║
║ │ [B][I][Σ] formatting     │  ║ • Cited by: 42            ║
║ └──────────────────────────┘  ║ • Altmetric: 8 🍩         ║
║ [Cancel] [Post comment]        ║ • News: 3                 ║
║                                ║                           ║
║ ┌──────────────────────────┐  ║ [Export citation ▼]       ║
║ │ ⬆ 15  Jane Smith  2d ago │  ║  APA • MLA • BibTeX       ║
║ │        [AUTHOR]           │  ║                           ║
║ │                           │  ║ ✓ ARE YOU AN AUTHOR?      ║
║ │ Great analysis of the... │  ║                           ║
║ │                           │  ║ [Verify with ORCID]       ║
║ │ Reply Edit Delete         │  ║                           ║
║ │  └─ ⬆ 3  John  1d ago     │  ║ 🔔 FOLLOW                 ║
║ │     Thanks for...         │  ║                           ║
║ │     Reply                 │  ║ [☐ Follow discussion]     ║
║ └──────────────────────────┘  ║                           ║
║                                ║ 💡 RELATED                ║
║ ┌──────────────────────────┐  ║                           ║
║ │ ⬆ 8  testuser  1d ago    │  ║ • Visual attention...     ║
║ │                           │  ║ • fMRI studies of...      ║
║ │ I disagree because...    │  ║ • Primate cortex...       ║
║ │                           │  ║                           ║
║ │ Reply Edit Delete Report │  ║                           ║
║ └──────────────────────────┘  ║                           ║
║                                ║                           ║
║ [Load more comments]           ║                           ║
╚════════════════════════════════╩═══════════════════════════╝
```

**Key Improvements**:
1. Prominent paper title + authors with affiliations
2. Collapsible abstract
3. Vote buttons on comments (with counts)
4. Discussion stats sidebar (views, comments)
5. Paper metrics (citations, Altmetric)
6. Citation export
7. Follow discussion toggle
8. Related discussions
9. Author badge clearly visible
10. Report button for moderation

---

### 6.3 User Profile (Enhanced)

```
╔═══════════════════════════════════════════════════════════╗
║ [← Back]                             [Edit profile]        ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  [Avatar]  Dr. Jane Smith                                 ║
║            Assistant Professor, MIT                        ║
║            Cambridge, MA • Joined June 2026               ║
║                                                            ║
║  Neuroscientist studying visual attention mechanisms.     ║
║  Interested in fMRI, computational modeling, and...       ║
║                                                            ║
║  🔗 janesmith.com • ORCID • Scholar • @janesmith          ║
║                                                            ║
║  ┌──────────┬────────────┬────────────┬────────────┐     ║
║  │    12    │     145    │      3     │     24     │     ║
║  │Discussion│  Comments  │  Verified  │ Followers  │     ║
║  └──────────┴────────────┴────────────┴────────────┘     ║
║                                                            ║
║  🔥 532 reputation • Level: Contributor                   ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║ [Discussions] [Comments] [Bookmarks] [Followers]          ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║ ┌──────────────────────────────────────────────────────┐  ║
║ │ Neural mechanisms of visual attention...             │  ║
║ │ Doe, Smith, et al. • Nature Neuroscience • 2025      │  ║
║ │ 12 comments • Started 3 days ago                     │  ║
║ │ [Neuroscience] [fMRI]                                │  ║
║ └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║ ┌──────────────────────────────────────────────────────┐  ║
║ │ Computational models of...                           │  ║
║ │ Smith, Johnson • Science • 2024                      │  ║
║ │ 8 comments • Started 1 week ago                      │  ║
║ │ [Computational Neuroscience]                         │  ║
║ └──────────────────────────────────────────────────────┘  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**Key Improvements**:
1. Professional header with title + affiliation
2. Richer bio section
3. External links (website, ORCID, Scholar, Twitter)
4. Stats grid (discussions, comments, verifications, followers)
5. Reputation score with level/badge
6. Bookmarks tab
7. Followers/Following tabs
8. Better card layout for content

---

## BUDGET & EFFORT ESTIMATES

### Phase 1: Quick Wins
**Effort**: ~120 hours
**Cost** (at $150/hr): $18,000
**Timeline**: 3 weeks

### Phase 2: Core Features
**Effort**: ~280 hours
**Cost**: $42,000
**Timeline**: 6 weeks

### Phase 3: Advanced Features
**Effort**: ~340 hours
**Cost**: $51,000
**Timeline**: 8 weeks

### Phase 4: Polish & Scale
**Effort**: ~320 hours
**Cost**: $48,000
**Timeline**: 6 weeks

**Total**: ~1,060 hours, $159,000, ~23 weeks (5.5 months)

---

## RISK ASSESSMENT

### High Risk
1. **Scope creep**: Advanced features may expand significantly
   - Mitigation: Stick to phased approach, validate with users

2. **Third-party API reliability**: OpenCitations, Altmetric may fail
   - Mitigation: Graceful degradation, caching, fallbacks

3. **Spam/abuse**: Without moderation, platform could get flooded
   - Mitigation: Implement Phase 2 moderation tools early

### Medium Risk
1. **Database performance**: As data grows, queries may slow
   - Mitigation: Proper indexing, query optimization, caching

2. **User adoption**: Features may not resonate with academics
   - Mitigation: User research, beta testing, iterative improvements

### Low Risk
1. **UI consistency**: Design system may drift
   - Mitigation: Component library, style guide, code reviews

---

## SUCCESS METRICS

### Phase 1
- ✅ 0 XSS vulnerabilities (security audit)
- ✅ WCAG AA compliance (accessibility audit)
- ✅ 95%+ user satisfaction with UI (survey)

### Phase 2
- 📈 50%+ increase in comment engagement (voting, bookmarking)
- 📈 30%+ reduction in "I can't find" user complaints (search)
- 📈 80%+ of users use notifications weekly

### Phase 3
- 📈 40%+ of users follow topics/users
- 📈 60%+ of comments use @ mentions
- 📈 25%+ increase in return visits (digests, recommendations)

### Phase 4
- 📈 <200ms p95 API response time
- 📈 99.9% uptime
- 📈 100% test coverage for critical paths

---

## CONCLUSION

PostScholar has a solid technical foundation and clear product vision. To compete with established academic platforms, it needs:

1. **Professional UI polish** (icons, colors, spacing, accessibility)
2. **Core engagement features** (voting, bookmarks, notifications)
3. **Academic credibility** (metrics, citations, ORCID integration)
4. **Community health** (moderation, reputation, spam prevention)
5. **Discovery** (search, recommendations, trending)

By following this phased roadmap, PostScholar can evolve into a trusted, engaging platform for academic discourse. The key is to **ship incrementally**, validate with real users, and iterate based on feedback.

**Recommended First Steps**:
1. ✅ Implement Phase 1 (Quick Wins) — highest ROI
2. ✅ Beta test with 50-100 academics
3. ✅ Gather feedback and prioritize Phase 2 features
4. ✅ Secure funding for Phases 2-4 if needed

---

**Prepared by**: Senior Full-Stack Developer & UI/UX Designer
**Date**: June 6, 2026
**Contact**: For questions or clarifications
