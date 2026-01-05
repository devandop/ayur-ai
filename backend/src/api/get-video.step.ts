import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  duration: z.number().nullable(),
  instructor: z.string().nullable(),
  muxPlaybackId: z.string(),
  playbackUrl: z.string(),
  watchProgress: z.object({
    lastPosition: z.number(),
    watchedDuration: z.number(),
    completed: z.boolean(),
  }).nullable(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetVideo',
  description: 'Get single video by ID with playback URL and watch progress',
  path: '/api/videos/:id',
  method: 'GET',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  responseSchema: {
    200: responseSchema,
    401: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams

  logger.info('Fetching video', { videoId: id, userId: user.id })

  // Get video by ID (must be published)
  const video = await prisma.video.findUnique({
    where: { id },
  })

  if (!video) {
    logger.warn('Video not found', { videoId: id })
    throw new Error('Video not found')
  }

  if (!video.isPublished) {
    logger.warn('Video is not published', { videoId: id })
    throw new Error('Video not found')
  }

  // Get user's watch progress for this video
  const watchProgress = await prisma.videoWatch.findUnique({
    where: {
      userId_videoId: {
        userId: user.id,
        videoId: id,
      },
    },
  })

  // Construct playback URL from Mux playback ID
  const playbackUrl = `https://stream.mux.com/${video.muxPlaybackId}`

  const transformedVideo = {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    instructor: video.instructor,
    muxPlaybackId: video.muxPlaybackId,
    playbackUrl,
    watchProgress: watchProgress ? {
      lastPosition: watchProgress.lastPosition,
      watchedDuration: watchProgress.watchedDuration,
      completed: watchProgress.completed,
    } : null,
  }

  logger.info('Video fetched successfully', { videoId: id, userId: user.id })

  return {
    status: 200,
    body: transformedVideo,
  }
}
