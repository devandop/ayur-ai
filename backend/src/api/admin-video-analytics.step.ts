import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const videoStatsSchema = z.object({
  id: z.string(),
  title: z.string(),
  viewCount: z.number(),
  completionCount: z.number(),
  completionRate: z.number(), // percentage 0-100
})

const responseSchema = z.object({
  totalVideos: z.number(),
  totalViews: z.number(),
  totalUniqueViewers: z.number(),
  overallCompletionRate: z.number(), // percentage
  videosAnalytics: z.array(videoStatsSchema),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminVideoAnalytics',
  description: 'Get overall video analytics across all videos',
  path: '/api/admin/analytics/videos',
  method: 'GET',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  responseSchema: {
    200: responseSchema,
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx

  logger.info('Fetching overall video analytics')

  // Get all videos with watch stats
  const videos = await prisma.video.findMany({
    select: {
      id: true,
      title: true,
      watchHistory: {
        select: {
          userId: true,
          completed: true,
        },
      },
    },
  })

  // Calculate analytics
  const videosAnalytics = videos.map(video => {
    const viewCount = video.watchHistory.length
    const completionCount = video.watchHistory.filter(w => w.completed).length
    const completionRate = viewCount > 0 ? Math.round((completionCount / viewCount) * 100) : 0

    return {
      id: video.id,
      title: video.title,
      viewCount,
      completionCount,
      completionRate,
    }
  })

  // Calculate overall stats
  const totalVideos = videos.length
  const totalViews = videos.reduce((sum, v) => sum + v.watchHistory.length, 0)
  const uniqueViewers = new Set(
    videos.flatMap(v => v.watchHistory.map(w => w.userId))
  ).size
  const totalCompletions = videos.reduce(
    (sum, v) => sum + v.watchHistory.filter(w => w.completed).length,
    0
  )
  const overallCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0

  logger.info('Analytics fetched successfully', {
    totalVideos,
    totalViews,
    uniqueViewers,
  })

  return {
    status: 200,
    body: {
      totalVideos,
      totalViews,
      totalUniqueViewers: uniqueViewers,
      overallCompletionRate,
      videosAnalytics: videosAnalytics.sort((a, b) => b.viewCount - a.viewCount),
    },
  }
}
