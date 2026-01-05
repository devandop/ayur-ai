import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const bodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  instructor: z.string().max(255).optional(),
  isPublished: z.boolean().optional(),
})

const responseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  instructor: z.string().nullable(),
  isPublished: z.boolean(),
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminUpdateVideo',
  description: 'Admin updates video metadata',
  path: '/api/admin/videos/:id',
  method: 'PATCH',
  emits: ['video.updated'],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  bodySchema,
  responseSchema: {
    200: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger, emit } = ctx

  const { id: videoId } = req.pathParams
  const { title, description, instructor, isPublished } = req.body as z.infer<typeof bodySchema>

  logger.info('Admin updating video', { videoId })

  // Verify video exists
  const existingVideo = await prisma.video.findUnique({
    where: { id: videoId },
  })

  if (!existingVideo) {
    logger.warn('Video not found', { videoId })
    throw new Error('Video not found')
  }

  // Build update data object - only include provided fields
  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description || null
  if (instructor !== undefined) updateData.instructor = instructor || null
  if (isPublished !== undefined) updateData.isPublished = isPublished

  // Update video
  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: updateData,
  })

  // Emit event
  emit({
    topic: 'video.updated',
    payload: {
      videoId: updatedVideo.id,
      title: updatedVideo.title,
      changes: updateData,
      updatedAt: updatedVideo.updatedAt.toISOString(),
    },
  })

  logger.info('Video updated successfully', { videoId })

  return {
    status: 200,
    body: {
      id: updatedVideo.id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      instructor: updatedVideo.instructor,
      isPublished: updatedVideo.isPublished,
      updatedAt: updatedVideo.updatedAt.toISOString(),
    },
  }
}
