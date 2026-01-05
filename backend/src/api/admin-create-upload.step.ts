import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, createUploadSession } from './_shared.step.js'

const responseSchema = z.object({
  uploadId: z.string(),
  url: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminCreateUpload',
  description: 'Create a resumable upload session for video upload to Mux',
  path: '/api/admin/videos/upload',
  method: 'POST',
  emits: [],
  flows: ['video-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  responseSchema: {
    201: responseSchema,
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx

  logger.info('Creating upload session for video')

  try {
    const { uploadId, url } = await createUploadSession()

    logger.info('Upload session created', { uploadId })

    return {
      status: 201,
      body: { uploadId, url },
    }
  } catch (error: any) {
    logger.error('Error creating upload session', { error: error.message })
    throw error
  }
}
