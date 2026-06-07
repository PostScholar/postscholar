import Layout from '@/components/Layout'
import ProfileClient from './ProfileClient'

async function getProfile(username) {
  try {
    const res = await fetch(`${process.env.API_URL}/users/${username}`, {
      cache: 'no-store'
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
