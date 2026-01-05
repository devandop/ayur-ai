import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  videoId: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminDeleteVideo',
  description: 'Admin deletes a video and associated watch history',
  path: '/api/admin/videos/:id',
  method: 'DELETE',
  emits: ['video.deleted'],
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
  const { logger, emit } = ctx

  const { id: videoId } = req.pathParams

  logger.info('Admin deleting video', { videoId })

  // Verify video exists
  const existingVideo = await prisma.video.findUnique({
    where: { id: videoId },
  })

  if (!existingVideo) {
    logger.warn('Video not found for deletion', { videoId })
    throw new Error('Video not found')
  }

  // Delete video (cascade delete handles VideoWatch records)
  await prisma.video.delete({
    where: { id: videoId },
  })

  // Emit event
  emit({
    topic: 'video.deleted',
    payload: {
      videoId,
      title: existingVideo.title,
      deletedAt: new Date().toISOString(),
    },
  })

  logger.info('Video deleted successfully', { videoId, title: existingVideo.title })

  return {
    status: 200,
    body: {
      success: true,
      message: `Video "${existingVideo.title}" has been deleted`,
      videoId,
    },
  }
}
