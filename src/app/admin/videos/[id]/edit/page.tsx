'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { adminVideoApi } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditVideoPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string
  const { getToken } = useAuth()
  const { user } = useUser()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    isPublished: true,
  })

  // Fetch video data
  useEffect(() => {
    async function fetchVideo() {
      try {
        const token = await getToken()
        if (!token || !user?.emailAddresses[0]?.emailAddress) {
          toast({
            title: 'Error',
            description: 'Authentication failed',
            variant: 'destructive',
          })
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'}/api/admin/videos`,
          {
            method: 'GET',
            headers: {
              'x-clerk-user-id': token as string,
              'x-clerk-user-email': user.emailAddresses[0].emailAddress,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch videos')
        }

        const videos = await response.json()
        const video = videos.find((v: any) => v.id === videoId)

        if (!video) {
          toast({
            title: 'Error',
            description: 'Video not found',
            variant: 'destructive',
          })
          router.push('/admin/videos')
          return
        }

        setFormData({
          title: video.title,
          description: video.description || '',
          instructor: video.instructor || '',
          isPublished: video.isPublished,
        })
      } catch (error) {
        console.error('Error fetching video:', error)
        toast({
          title: 'Error',
          description: 'Failed to load video',
          variant: 'destructive',
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchVideo()
  }, [videoId, getToken, user, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = await getToken()
      if (!token || !user?.emailAddresses[0]?.emailAddress) {
        toast({
          title: 'Error',
          description: 'Authentication failed',
          variant: 'destructive',
        })
        return
      }

      await adminVideoApi.updateVideo(
        videoId,
        {
          title: formData.title,
          description: formData.description || undefined,
          instructor: formData.instructor || undefined,
          isPublished: formData.isPublished,
        },
        {
          'x-clerk-user-id': token as string,
          'x-clerk-user-email': user.emailAddresses[0].emailAddress,
        }
      )

      toast({
        title: 'Success',
        description: 'Video updated successfully',
      })

      router.push('/admin/videos')
    } catch (error) {
      console.error('Error updating video:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update video',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-12 pt-24">
          {/* Back Button */}
          <Link href="/admin/videos" className="inline-block mb-6">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Videos
            </Button>
          </Link>

          {/* Form Card */}
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Video</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Video title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  placeholder="Instructor name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Video description and details"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Published Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <label className="text-sm font-medium text-gray-700">
                  Publish this video
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title}
                  className="flex-1"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/admin/videos" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
