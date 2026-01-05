'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { adminVideoApi } from '@/lib/api'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function AddVideoPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user } = useUser()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [playbackId, setPlaybackId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    muxPlaybackId: '',
    description: '',
    instructor: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadToMux = async () => {
    if (!selectedFile || !user?.emailAddresses[0]?.emailAddress) {
      alert('Please select a file first')
      return
    }

    setIsUploading(true)
    try {
      const token = await getToken()
      if (!token) {
        alert('Authentication failed')
        return
      }

      // Create upload session
      const uploadSession = await adminVideoApi.addVideo(
        {
          title: selectedFile.name,
          muxPlaybackId: '', // Will be populated after upload
          description: '',
          instructor: '',
        },
        {
          'x-clerk-user-id': token as string,
          'x-clerk-user-email': user.emailAddresses[0].emailAddress,
        }
      )

      alert('Video upload initiated. Please visit your Mux dashboard to get the playback ID.')
    } catch (error) {
      console.error('Error uploading to Mux:', error)
      alert('Failed to initiate upload. Check console for details.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = await getToken()
      if (!token || !user?.emailAddresses[0]?.emailAddress) {
        alert('Authentication failed')
        return
      }

      await adminVideoApi.addVideo(
        {
          title: formData.title,
          muxPlaybackId: formData.muxPlaybackId,
          description: formData.description || undefined,
          instructor: formData.instructor || undefined,
        },
        {
          'x-clerk-user-id': token as string,
          'x-clerk-user-email': user.emailAddresses[0].emailAddress,
        }
      )

      alert('Video added successfully')
      router.push('/admin/videos')
    } catch (error) {
      console.error('Error adding video:', error)
      alert(error instanceof Error ? error.message : 'Failed to add video')
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Video</h1>

            {/* Upload Section */}
            <div className="mb-8 p-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Video to Mux</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Video File
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedFile && (
                    <div className="mt-2 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  After uploading, visit your Mux dashboard to get the playback ID for this video, then fill in the form below.
                </p>
              </div>
            </div>

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

              {/* Mux Playback ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mux Playback ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="muxPlaybackId"
                  value={formData.muxPlaybackId}
                  onChange={handleChange}
                  required
                  placeholder="e.g., VZtzUzGRv02OhRnZCxcNGyOOilGTqdnFCY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Find this in your Mux dashboard under the video asset</p>
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

              {/* Form Actions */}
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.title || !formData.muxPlaybackId}
                    className="flex-1"
                  >
                    {isLoading ? 'Adding...' : 'Add Video'}
                  </Button>
                  <Link href="/admin/videos" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>
            </form>

            {/* Upload File Button - Outside form */}
            <div className="mt-8 pt-6 border-t">
              <Button
                onClick={handleUploadToMux}
                disabled={isUploading || !selectedFile}
                variant="secondary"
                className="w-full"
              >
                {isUploading ? 'Uploading to Mux...' : 'Upload File to Mux'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will upload your video file to Mux and provide you with a playback ID
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
