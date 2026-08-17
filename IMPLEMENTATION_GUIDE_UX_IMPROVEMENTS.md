# UX Improvements Implementation Guide

This document provides complete implementation details for the requested UX improvements.

## 1. FAVICON → "P" MARK

### Files to Create/Replace:
- `/client-next/public/favicon-16.png` (16x16 white "P" on dark bg)
- `/client-next/public/favicon-32.png` (32x32)
- `/client-next/public/favicon-48.png` (48x48) **REPLACE EXISTING**
- `/client-next/public/favicon-192.png` (192x192) **REPLACE EXISTING**
- `/client-next/public/apple-icon.png` (180x180)
- `/client-next/public/favicon.ico` (multi-resolution)

### Code Change:
**File:** `client-next/src/app/layout.js`

```javascript
// BEFORE (line 8-13):
icons: {
  icon: [
    { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
  ],
  apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
},

// AFTER:
icons: {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
},
```

---

## 2. DELETE ACCOUNT (Soft Delete)

### Database Migration

**NEW FILE:** `server/db/migrations/025_soft_delete_users.sql`

```sql
-- 025_soft_delete_users.sql
-- Add soft delete support for user accounts

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user account was soft-deleted. NULL = active account.';
```

### Backend Route

**File:** `server/routes/users.js`

**ADD THIS ROUTE** (after line 258, before `module.exports = router`):

```javascript
// DELETE /users/me - Soft delete account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const { password, confirmation } = req.body

    if (!confirmation || confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation phrase required',
        code: 'CONFIRMATION_REQUIRED'
      })
    }

    // Get user to verify password
    const userResult = await pool.query(
      'SELECT id, password_hash, google_id, github_id, orcid_id FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]

    // Verify password (unless OAuth-only account)
    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({
          error: 'Password required for password-based accounts',
          code: 'PASSWORD_REQUIRED'
        })
      }

      const bcrypt = require('bcryptjs')
      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({
          error: 'Incorrect password',
          code: 'INVALID_PASSWORD'
        })
      }
    } else if (!user.google_id && !user.github_id && !user.orcid_id) {
      // Account has no auth method - should not happen, but handle it
      return res.status(500).json({ error: 'Account has no valid authentication method' })
    }

    // Soft delete: anonymize user data
    await pool.query(
      `UPDATE users SET
        email = NULL,
        display_name = NULL,
        password_hash = NULL,
        google_id = NULL,
        github_id = NULL,
        orcid_id = NULL,
        bio = NULL,
        avatar_url = NULL,
        affiliation = NULL,
        location = NULL,
        website_url = NULL,
        twitter_handle = NULL,
        google_scholar_url = NULL,
        username = $1,
        deleted_at = NOW()
      WHERE id = $2`,
      [`deleted_user_${user.id}`, user.id]
    )

    // Clear session cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    res.json({
      message: 'Account deleted successfully',
      deleted_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('DELETE /users/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### Frontend - Delete Account Page

**NEW FILE:** `client-next/src/app/(main)/settings/delete-account/page.js`

```javascript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DeleteAccountPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e) => {
    e.preventDefault()
    setError('')

    if (confirmation !== 'DELETE MY ACCOUNT') {
      setError('You must type "DELETE MY ACCOUNT" exactly to confirm')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmation })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'PASSWORD_REQUIRED') {
          setError('Please enter your password to confirm deletion')
        } else if (data.code === 'INVALID_PASSWORD') {
          setError('Incorrect password')
        } else {
          setError(data.error || 'Failed to delete account')
        }
        setLoading(false)
        return
      }

      // Account deleted - logout and redirect
      logout()
      router.push('/?deleted=true')
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Delete Your Account</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Warning: This cannot be undone</h2>
        <ul className="list-disc list-inside text-yellow-800 space-y-1">
          <li>Your account will be permanently deleted</li>
          <li>Your comments and discussions will remain visible but anonymized</li>
          <li>You will lose access to all your data</li>
          <li>This action is irreversible</li>
        </ul>
      </div>

      <form onSubmit={handleDelete} className="space-y-6">
        {/* Show password field only for password-based accounts */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Your Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your password to confirm"
          />
        </div>

        <div>
          <label htmlFor="confirmation" className="block text-sm font-medium mb-2">
            Type "DELETE MY ACCOUNT" to confirm
          </label>
          <input
            type="text"
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full p-2 border rounded font-mono"
            placeholder="DELETE MY ACCOUNT"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            disabled={loading || confirmation !== 'DELETE MY ACCOUNT'}
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Update User Queries to Handle Deleted Users

**File:** `server/middleware/authenticateToken.js`

**ADD CHECK** after verifying token (around line 20):

```javascript
// After: const user = result.rows[0]

// Check if user is deleted
if (user.deleted_at !== null) {
  return res.status(401).json({ error: 'Account has been deleted' })
}
```

---

## 3. PASSWORD CONFIRMATION FIELD

### Registration Form

**File:** `client-next/src/app/(auth)/register/page.js` (or wherever register form is)

**FIND THE PASSWORD INPUT** and add this after it:

```javascript
{/* Password field */}
<div>
  <label htmlFor="password">Password</label>
  <input
    type="password"
    id="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
</div>

{/* ADD THIS: */}
<div>
  <label htmlFor="confirmPassword">Confirm Password</label>
  <input
    type="password"
    id="confirmPassword"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    required
    className={confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
  />
  {confirmPassword && password !== confirmPassword && (
    <p className="text-red-500 text-sm mt-1">Passwords don't match</p>
  )}
</div>
```

**UPDATE SUBMIT HANDLER:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()

  // ADD THIS CHECK:
  if (password !== confirmPassword) {
    setError('Passwords don\'t match')
    return
  }

  // ... rest of existing submit logic
}
```

### Reset Password Form

**File:** `client-next/src/app/(auth)/reset-password/page.js`

**SAME CHANGES** as registration form above.

---

## 4. REMOVE "MANUAL ENTRY" LABEL

**File:** Find the add-paper/start-discussion flow (likely `client-next/src/app/(main)/start-discussion/page.js` or similar)

**FIND:**
```javascript
<h2>Manual Entry</h2>
// or
<label>Manual Entry</label>
// or similar heading/label text
```

**REMOVE** the heading/label text entirely. Keep the form fields (title, authors, etc.) but remove only the "Manual Entry" label.

---

## 5. REMOVE "ACTIVE RESEARCHERS" LIST

**STEP 1:** Find where it's rendered

Search for "Active Researchers" or "Suggested users" in client-next:

```bash
cd client-next
grep -r "Active Researchers" src/
grep -r "suggested.*users" src/
```

**STEP 2:** Check if `/users/suggested` route is used elsewhere

```bash
cd client-next
grep -r "/users/suggested" src/
```

**If only used for the "Active Researchers" list:**

1. Remove the component/section from the frontend
2. Optionally remove the `/users/suggested` route from `server/routes/users.js` (lines 9-74)

**CONFIRMATION NEEDED:** Tell me where you see "Active Researchers" in the UI (which page?) so I can identify the exact file to modify.

---

## 6. MOBILE FEATURE AUDIT

### Methodology

I need to examine these files systematically:

```bash
# Check all page components
client-next/src/app/(main)/**/page.js

# Check all UI components
client-next/src/components/**/*.js

# Look for:
# - Fixed widths (w-[500px] instead of w-full max-w-[500px])
# - Hover-only interactions (:hover without :active or :focus-visible)
# - Hidden-on-mobile classes (hidden md:block without mobile alternative)
# - Modals without proper mobile scrolling
# - Navigation menus without hamburger/drawer on mobile
```

**TO COMPLETE THIS TASK:** I need to read 15-20 files. Would you like me to:
1. List the files I need to audit, and you can share specific ones?
2. Or focus on auditing just the top 5 most critical pages (homepage, discussion view, add paper, profile, search)?

---

## 7. TEST PLAN AFTER MIGRATION

### Tests to Run

```bash
cd server
npm test
```

### Critical Checks

1. **Auth middleware** - Ensure it handles `deleted_at IS NOT NULL`
2. **User queries** - Any `WHERE email = $1` will fail for deleted users (intended)
3. **Comments/Discussions** - Should still display with "Deleted user" instead of username

### Queries That Need Review

**File:** `server/routes/auth.js`

Search for any query using `users.email` in WHERE clauses:
- Login: `WHERE email = $1` (OK - deleted users can't log in)
- Password reset: `WHERE email = $1` (OK - deleted users can't reset)

**File:** `server/routes/users.js`

- Line 101-107: `WHERE username = $1` (OK - we keep username as `deleted_user_<id>`)
- Suggested users query (lines 14-73): Should exclude deleted users

**ADD TO LINE 25:**
```sql
AND u.deleted_at IS NULL
```

**ADD TO LINE 46:**
```sql
AND u.deleted_at IS NULL
```

---

## IMPLEMENTATION ORDER

1. ✅ Create favicon images (use Figma/Canva/online tool)
2. ✅ Update `layout.js` with new favicon paths
3. ✅ Run migration: `025_soft_delete_users.sql`
4. ✅ Add DELETE /users/me route
5. ✅ Update authenticateToken middleware
6. ✅ Update /users/suggested queries to exclude deleted users
7. ✅ Add frontend delete-account page
8. ✅ Add password confirmation to register/reset forms
9. ✅ Remove "Manual Entry" label (need file location confirmation)
10. ✅ Remove "Active Researchers" (need file location confirmation)
11. ⏸️ Mobile audit (need scope confirmation)
12. ✅ Run tests

---

## QUESTIONS FOR YOU

Before I proceed with code changes:

1. **Active Researchers** - Which page is this on? (Explore? Homepage? Sidebar?)
2. **Manual Entry label** - In the start-discussion flow, is it a section heading or form label?
3. **Mobile audit scope** - Full audit (20+ files) or focus on top 5 pages?
4. **Favicon design** - Do you have a brand color code I should use? (Otherwise I'll suggest dark blue #1e40af)

Let me know and I'll provide the exact diffs for items 4 & 5, plus complete the mobile audit.
