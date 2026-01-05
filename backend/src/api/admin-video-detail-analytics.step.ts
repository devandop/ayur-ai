import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const topViewerSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
  lastPosition: z.number(),
  watchedDuration: z.number(),
  completed: z.boolean(),
  lastWatchedAt: z.string(),
})

const responseSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string(),
  totalViews: z.number(),
  totalCompletions: z.number(),
  completionRate: z.number(),
  averageWatchTime: z.number(),
  topViewers: z.array(topViewerSchema),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminVideoDetailAnalytics',
  description: 'Get detailed analytics for a specific video',
  path: '/api/admin/analytics/videos/:id',
  method: 'GET',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  responseSchema: {
    200: responseSchema,
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx

  const { id: videoId } = req.pathParams

  logger.info('Fetching detailed video analytics', { videoId })

  // Get video with watch history
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      watchHistory: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          watchedDuration: 'desc',
        },
      },
    },
  })

  if (!video) {
    logger.warn('Video not found', { videoId })
    throw new Error('Video not found')
  }

  // Calculate analytics
  const totalViews = video.watchHistory.length
  const totalCompletions = video.watchHistory.filter(w => w.completed).length
  const completionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0
  const averageWatchTime = totalViews > 0
    ? Math.round(
      video.watchHistory.reduce((sum, w) => sum + w.watchedDuration, 0) / totalViews
    )
    : 0

  // Get top viewers (limit to 10)
  const topViewers = video.watchHistory.slice(0, 10).map(watch => ({
    userId: watch.user.id,
    userEmail: watch.user.email,
    lastPosition: watch.lastPosition,
    watchedDuration: watch.watchedDuration,
    completed: watch.completed,
    lastWatchedAt: watch.updatedAt.toISOString(),
  }))

  logger.info('Video analytics fetched successfully', {
    videoId,
    totalViews,
    completionRate,
  })

  return {
    status: 200,
    body: {
      videoId: video.id,
      videoTitle: video.title,
      totalViews,
      totalCompletions,
      completionRate,
      averageWatchTime,
      topViewers,
    },
  }
}
