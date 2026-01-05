import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const bodySchema = z.object({
  position: z.number().min(0),
  duration: z.number().min(0),
})

const responseSchema = z.object({
  lastPosition: z.number(),
  watchedDuration: z.number(),
  completed: z.boolean(),
  percentage: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateVideoProgress',
  description: 'Update user video watch progress and track analytics',
  path: '/api/videos/:id/progress',
  method: 'POST',
  emits: ['video.progress-updated', 'video.completed'],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  bodySchema,
  responseSchema: {
    200: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger, emit } = ctx
  const user = (ctx as any).user

  const { id: videoId } = req.pathParams
  const { position, duration } = req.body as z.infer<typeof bodySchema>

  logger.info('Updating video progress', {
    videoId,
    userId: user.id,
    position,
    duration,
  })

  // Verify video exists
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  })

  if (!video) {
    logger.warn('Video not found', { videoId })
    throw new Error('Video not found')
  }

  // Calculate watched percentage
  const percentage = duration > 0 ? Math.round((position / duration) * 100) : 0
  const isCompleted = percentage >= 95

  // Create or update watch history
  const watchHistory = await prisma.videoWatch.upsert({
    where: {
      userId_videoId: {
        userId: user.id,
        videoId,
      },
    },
    update: {
      lastPosition: position,
      watchedDuration: Math.max(position, 0), // Ensure it never goes backward
      completed: isCompleted,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      videoId,
      lastPosition: position,
      watchedDuration: position,
      completed: isCompleted,
    },
  })

  // Emit analytics events
  emit({
    topic: 'video.progress-updated',
    payload: {
      videoId,
      userId: user.id,
      position,
      duration,
      percentage,
      timestamp: new Date().toISOString(),
    },
  })

  if (isCompleted && !watchHistory.completed) {
    emit({
      topic: 'video.completed',
      payload: {
        videoId,
        userId: user.id,
        completedAt: new Date().toISOString(),
      },
    })
  }

  logger.info('Video progress updated', {
    videoId,
    userId: user.id,
    percentage,
    completed: isCompleted,
  })

  return {
    status: 200,
    body: {
      lastPosition: watchHistory.lastPosition,
      watchedDuration: watchHistory.watchedDuration,
      completed: watchHistory.completed,
      percentage,
    },
  }
}
