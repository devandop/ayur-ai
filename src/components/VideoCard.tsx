'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface VideoCardProps {
  id: string
  title: string
  instructor?: string | null
  thumbnailUrl?: string | null
  duration?: number | null
  watchProgress?: {
    lastPosition: number
    watchedDuration: number
    completed: boolean
  } | null
}

export function VideoCard({
  id,
  title,
  instructor,
  thumbnailUrl,
  duration,
  watchProgress,
}: VideoCardProps) {
  // Calculate progress percentage
  const progressPercent = duration && duration > 0
    ? Math.round((watchProgress?.watchedDuration || 0) / duration * 100)
    : 0

  const formattedDuration = duration
    ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
    : 'N/A'

  return (
    <Link href={`/dashboard/library/${id}`}>
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col cursor-pointer border border-gray-200 hover:border-primary/50">
        {/* Thumbnail Container */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-gray-400">No thumbnail</span>
            </div>
          )}

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white fill-white" />
            </div>
          </div>

          {/* Duration Badge */}
          {duration && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 bg-black/70 text-white hover:bg-black/80"
            >
              {formattedDuration}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {instructor && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{instructor}</p>
          )}

          {/* Progress Bar */}
          {watchProgress && progressPercent > 0 && (
            <div className="mt-auto pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Progress</span>
                <span className="text-xs font-medium text-primary">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
