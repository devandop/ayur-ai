'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { videoApi } from '@/lib/api'

interface VideoPlayerProps {
  videoId: string
  muxPlaybackId: string
  duration?: number | null
  initialPosition?: number
}

export function VideoPlayer({
  videoId,
  muxPlaybackId,
  duration,
  initialPosition = 0,
}: VideoPlayerProps) {
  const { getToken } = useAuth()
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save progress with debouncing (every 15 seconds of actual playback)
  useEffect(() => {
    if (!videoId || !duration || isTracking) return

    setIsTracking(true)

    const trackProgress = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        await videoApi.updateProgress(
          videoId,
          currentTime,
          duration,
          {
            'x-clerk-user-id': token as string,
          }
        )
      } catch (err) {
        console.error('Failed to track progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to track progress')
      } finally {
        setIsTracking(false)
      }
    }

    // Track progress every 15 seconds instead of 10 (reduces API calls by 33%)
    trackingTimeoutRef.current = setTimeout(trackProgress, 15000)

    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current)
      }
    }
  }, [videoId, currentTime, duration, getToken, isTracking])

  // Resume from last position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition
    }
  }, [initialPosition])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current)
      }
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleError = (err: any) => {
    console.error('Video player error:', err)
    setError('Failed to load video')
  }

  return (
    <div className="w-full">
      {/* Video Player */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden mb-6">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <p className="text-gray-400 text-sm mt-2">Please try refreshing the page</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={`https://stream.mux.com/${muxPlaybackId}.m3u8`}
          controls
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          crossOrigin="anonymous"
        />
      </div>

      {isTracking && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Saving progress...
        </div>
      )}
    </div>
  )
}
