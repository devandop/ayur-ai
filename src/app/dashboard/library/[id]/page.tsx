import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { syncUser } from '@/lib/actions/users'

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

async function getVideo(videoId: string, clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${MOTIA_API_URL}/api/videos/${videoId}`, {
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
      throw new Error(`Failed to fetch video: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching video:', error)
    return null
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VideoPlayerPage({ params }: PageProps) {
  const { id: videoId } = await params
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  // Sync user with backend
  await syncUser()

  const email = user.emailAddresses[0]?.emailAddress || ''
  const clerkId = user.id
  const firstName = user.firstName || undefined
  const lastName = user.lastName || undefined

  // Fetch video
  const video = await getVideo(videoId, clerkId, email, firstName, lastName)

  if (!video) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Video Not Found</h1>
            <p className="text-muted-foreground mb-6">The video you're looking for doesn't exist or has been removed.</p>
            <Link href="/dashboard/library">
              <Button>Back to Library</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8 pt-24">
          {/* Back Button */}
          <Link href="/dashboard/library" className="inline-block mb-6">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </Link>

          {/* Video Player */}
          <VideoPlayer
            videoId={video.id}
            muxPlaybackId={video.muxPlaybackId}
            duration={video.duration}
            initialPosition={video.watchProgress?.lastPosition || 0}
          />
        </div>
      </div>
    </>
  )
}
