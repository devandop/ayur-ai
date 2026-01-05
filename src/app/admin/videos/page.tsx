import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

async function getAdminVideos(clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${MOTIA_API_URL}/api/admin/videos`, {
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
      throw new Error(`Failed to fetch videos: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export default async function AdminVideosPage() {
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

  // Fetch videos
  const videos = await getAdminVideos(clerkId, email, firstName, lastName)

  if (videos === null) {
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Videos</h1>
              <p className="text-gray-600">Add, edit, or delete videos from your library</p>
            </div>
            <Link href="/admin/videos/add">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Video
              </Button>
            </Link>
          </div>

          {/* Videos Table */}
          <Card className="overflow-hidden">
            {videos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-lg">No videos yet</p>
                <p className="text-gray-500 mt-2">Start by adding your first video</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instructor</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Views</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video: any, index: number) => (
                      <tr key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{video.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{video.instructor || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{video.viewCount}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={video.isPublished ? 'default' : 'secondary'}>
                            {video.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/videos/${video.id}/edit`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/admin/analytics/${video.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                Stats
                              </Button>
                            </Link>
                            {/* Delete handled by JavaScript in client component */}
                          </div>
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
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline">View Analytics</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
