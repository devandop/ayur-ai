import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, getUploadStatus } from './_shared.step.js'

const responseSchema = z.object({
  status: z.enum(['waiting', 'processing', 'ready', 'errored']),
  assetId: z.string().optional(),
  playbackId: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminGetUploadStatus',
  description: 'Poll upload status and get playback ID when ready',
  path: '/api/admin/videos/upload/:uploadId/status',
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
  const { uploadId } = req.pathParams

  logger.info('Getting upload status', { uploadId })

  try {
    const status = await getUploadStatus(uploadId)

    logger.info('Upload status retrieved', { uploadId, status: status.status })

    return {
      status: 200,
      body: status,
    }
  } catch (error: any) {
    logger.error('Error getting upload status', { uploadId, error: error.message })
    throw error
  }
}
