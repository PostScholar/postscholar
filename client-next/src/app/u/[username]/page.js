import { cookies } from 'next/headers'
import Layout from '@/components/Layout'
import ProfileClient from './ProfileClient'
import { getServerApiUrl } from '@/lib/config'

async function getProfile(username) {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await fetch(`${getServerApiUrl()}/users/${username}`, {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params
  return {
    title: `${username} — PostScholar`,
  }
}

export default async function ProfilePage({ params }) {
  const { username } = await params
  const data = await getProfile(username)

  if (!data) {
    return (
      <Layout>
        <p>User not found.</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <ProfileClient profile={data.profile} />
    </Layout>
  )
}
