import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Clock, TrendingUp } from 'lucide-react'

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

async function getVideoAnalytics(videoId: string, clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${MOTIA_API_URL}/api/admin/analytics/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'x-clerk-user-id': clerkId,
        'x-clerk-user-email': email,
        ...(firstName && { 'x-clerk-user-first-name': firstName }),
        ...(lastName && { 'x-clerk-user-last-name': lastName }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch video analytics: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching video analytics:', error)
    return null
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VideoDetailAnalyticsPage({ params }: PageProps) {
  const { id: videoId } = await params
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

  // Fetch video analytics
  const analytics = await getVideoAnalytics(videoId, clerkId, email, firstName, lastName)

  if (!analytics) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Video Not Found</h1>
            <p className="text-gray-600 mt-2">The video analytics you're looking for don't exist.</p>
            <Link href="/admin/analytics" className="mt-4 inline-block">
              <Button>Back to Analytics</Button>
            </Link>
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

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
          {/* Back Button */}
          <Link href="/admin/analytics" className="inline-block mb-6">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Analytics
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{analytics.videoTitle}</h1>
            <p className="text-gray-600">Detailed performance metrics for this video</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              label="Total Views"
              value={analytics.totalViews}
              color="bg-blue-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Completions"
              value={analytics.totalCompletions}
              color="bg-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${analytics.completionRate}%`}
              color="bg-purple-500"
            />
            <StatCard
              icon={Clock}
              label="Avg Watch Time"
              value={formatSeconds(analytics.averageWatchTime)}
              color="bg-orange-500"
            />
          </div>

          {/* Top Viewers Table */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Top Viewers</h2>
            </div>

            {analytics.topViewers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-lg">No viewers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Viewer Email</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Watch Time</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Last Position</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Last Watched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topViewers.map((viewer: any, index: number) => (
                      <tr key={viewer.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{viewer.userEmail}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                          {formatSeconds(viewer.watchedDuration)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                          {formatSeconds(viewer.lastPosition)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              viewer.completed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {viewer.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                          {new Date(viewer.lastWatchedAt).toLocaleDateString()}
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
            <Link href="/admin/analytics">
              <Button variant="outline">Back to All Analytics</Button>
            </Link>
            <Link href="/admin/videos">
              <Button variant="outline">Manage Videos</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
