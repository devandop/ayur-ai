import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const videoSchema = z.object({
  id: z.string(),
  title: z.string(),
  instructor: z.string().nullable(),
  isPublished: z.boolean(),
  viewCount: z.number(),
  completionCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const listResponseSchema = z.array(videoSchema)

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminListVideos',
  description: 'Admin lists all videos (published and unpublished) with stats',
  path: '/api/admin/videos',
  method: 'GET',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  responseSchema: {
    200: listResponseSchema,
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx

  logger.info('Admin fetching all videos')

  // Get all videos with watch stats
  const videos = await prisma.video.findMany({
    select: {
      id: true,
      title: true,
      instructor: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      watchHistory: {
        select: {
          completed: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Transform with stats
  const videosWithStats = videos.map(video => ({
    id: video.id,
    title: video.title,
    instructor: video.instructor,
    isPublished: video.isPublished,
    viewCount: video.watchHistory.length,
    completionCount: video.watchHistory.filter(w => w.completed).length,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  }))

  logger.info('Videos fetched successfully', { videoCount: videos.length })

  return {
    status: 200,
    body: videosWithStats,
  }
}
