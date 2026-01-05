import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { VideoCard } from '@/components/VideoCard'
import { syncUser } from '@/lib/actions/users'

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

async function getVideos(clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${MOTIA_API_URL}/api/videos`, {
      method: 'GET',
      headers: {
        'x-clerk-user-id': clerkId,
        'x-clerk-user-email': email,
        ...(firstName && { 'x-clerk-user-first-name': firstName }),
        ...(lastName && { 'x-clerk-user-last-name': lastName }),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export default async function LibraryPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  // Sync user with backend
  await syncUser()

  const email = user.emailAddresses[0]?.emailAddress || ''
  const clerkId = user.id
  const firstName = user.firstName
  const lastName = user.lastName

  // Fetch videos
  const videos = await getVideos(clerkId, email, firstName, lastName)

  // Separate continued and new videos
  const continuedVideos = videos.filter((v: any) => v.watchProgress && v.watchProgress.watchedDuration > 0)
  const newVideos = videos.filter((v: any) => !v.watchProgress || v.watchProgress.watchedDuration === 0)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Video Library</h1>
            <p className="text-muted-foreground">Browse and watch all informative videos</p>
          </div>

          {/* Continue Watching Section */}
          {continuedVideos.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Continue Watching</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {continuedVideos.map((video: any) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    instructor={video.instructor}
                    thumbnailUrl={video.thumbnailUrl}
                    duration={video.duration}
                    watchProgress={video.watchProgress}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Videos Section */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {continuedVideos.length > 0 ? 'More Videos' : 'All Videos'}
            </h2>

            {videos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No videos available yet</p>
                <p className="text-muted-foreground/70 mt-2">Check back soon for new courses!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {newVideos.map((video: any) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    instructor={video.instructor}
                    thumbnailUrl={video.thumbnailUrl}
                    duration={video.duration}
                    watchProgress={video.watchProgress}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
