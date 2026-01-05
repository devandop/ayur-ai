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
  watchProgress: z.object({
    lastPosition: z.number(),
    watchedDuration: z.number(),
    completed: z.boolean(),
  }).nullable(),
})

const listResponseSchema = z.array(responseSchema)

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ListVideos',
  description: 'Get all published videos with user watch progress',
  path: '/api/videos',
  method: 'GET',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  responseSchema: {
    200: listResponseSchema,
    401: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  logger.info('Fetching published videos', { userId: user.id })

  // Get all published videos
  const videos = await prisma.video.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      duration: true,
      instructor: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  logger.info(`Found ${videos.length} published videos`, { videoCount: videos.length })

  // Get watch history for all videos for this user
  const watchHistory = await prisma.videoWatch.findMany({
    where: {
      userId: user.id,
      videoId: {
        in: videos.map(v => v.id),
      },
    },
    select: {
      videoId: true,
      lastPosition: true,
      watchedDuration: true,
      completed: true,
    },
  })

  // Create a map for quick lookup
  const watchMap = new Map(
    watchHistory.map(w => [w.videoId, {
      lastPosition: w.lastPosition,
      watchedDuration: w.watchedDuration,
      completed: w.completed,
    }])
  )

  // Transform videos with watch progress
  const videosWithProgress = videos.map(video => ({
    ...video,
    watchProgress: watchMap.get(video.id) || null,
  }))

  logger.info('Videos fetched successfully', { userId: user.id, videoCount: videos.length })

  return {
    status: 200,
    body: videosWithProgress,
  }
}
