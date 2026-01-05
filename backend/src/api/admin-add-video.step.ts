import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const bodySchema = z.object({
  title: z.string().min(1).max(255),
  muxPlaybackId: z.string().min(1),
  description: z.string().max(2000).optional(),
  instructor: z.string().max(255).optional(),
})

const responseSchema = z.object({
  id: z.string(),
  title: z.string(),
  muxPlaybackId: z.string(),
  description: z.string().nullable(),
  instructor: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminAddVideo',
  description: 'Admin adds a new video to the system',
  path: '/api/admin/videos',
  method: 'POST',
  emits: ['video.created'],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  bodySchema,
  responseSchema: {
    201: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger, emit } = ctx

  const { title, muxPlaybackId, description, instructor } = req.body as z.infer<typeof bodySchema>

  logger.info('Admin adding new video', {
    title,
    muxPlaybackId,
  })

  // Check if video with this muxPlaybackId already exists
  const existingVideo = await prisma.video.findUnique({
    where: { muxPlaybackId },
  })

  if (existingVideo) {
    logger.warn('Video with this muxPlaybackId already exists', { muxPlaybackId })
    throw new Error('A video with this Mux Playback ID already exists')
  }

  // Create video record
  const video = await prisma.video.create({
    data: {
      title,
      muxPlaybackId,
      description: description || null,
      instructor: instructor || null,
      isPublished: true,
    },
  })

  // Emit event
  emit({
    topic: 'video.created',
    payload: {
      videoId: video.id,
      title: video.title,
      createdAt: video.createdAt.toISOString(),
    },
  })

  logger.info('Video created successfully', {
    videoId: video.id,
    title: video.title,
  })

  return {
    status: 201,
    body: {
      id: video.id,
      title: video.title,
      muxPlaybackId: video.muxPlaybackId,
      description: video.description,
      instructor: video.instructor,
      isPublished: video.isPublished,
      createdAt: video.createdAt.toISOString(),
    },
  }
}
