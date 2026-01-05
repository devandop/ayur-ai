import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Users, TrendingUp, Play } from 'lucide-react'

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

async function getAnalytics(clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${MOTIA_API_URL}/api/admin/analytics/videos`, {
      method: 'GET',
      headers: {
        'x-clerk-user-id': clerkId,
        'x-clerk-user-email': email,
        ...(firstName && { 'x-clerk-user-first-name': firstName }),
        ...(lastName && { 'x-clerk-user-last-name': lastName }),
      },
    })

    if (!response.ok) {
      if (response.status === 403) {
        return null // Not admin
      }
      throw new Error(`Failed to fetch analytics: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return null
  }
}

export default async function AdminAnalyticsPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.emailAddresses[0]?.emailAddress !== adminEmail) {
    redirect('/dashboard')
  }

  const email = user.emailAddresses[0]?.emailAddress || ''
  const clerkId = user.id
  const firstName = user.firstName
  const lastName = user.lastName

  // Fetch analytics
  const analytics = await getAnalytics(clerkId, email, firstName, lastName)

  if (analytics === null) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </>
    )
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Video Analytics</h1>
            <p className="text-gray-600">View overall statistics and per-video performance</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Play}
              label="Total Videos"
              value={analytics.totalVideos}
              color="bg-blue-500"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={analytics.totalViews}
              color="bg-purple-500"
            />
            <StatCard
              icon={Users}
              label="Unique Viewers"
              value={analytics.totalUniqueViewers}
              color="bg-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${analytics.overallCompletionRate}%`}
              color="bg-orange-500"
            />
          </div>

          {/* Videos Analytics Table */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Video Performance</h2>
            </div>

            {analytics.videosAnalytics.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-lg">No video data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Video Title</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Views</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Completions</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Completion Rate</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.videosAnalytics.map((video: any, index: number) => (
                      <tr key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{video.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{video.viewCount}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{video.completionCount}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all"
                                style={{ width: `${video.completionRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {video.completionRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/analytics/${video.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <Link href="/admin/videos">
              <Button variant="outline">Manage Videos</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
