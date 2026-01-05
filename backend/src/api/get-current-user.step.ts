import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware } from './_shared.step.js'

const responseSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetCurrentUser',
  description: 'Get current authenticated user profile',
  path: '/api/users/me',
  method: 'GET',
  emits: [],
  flows: ['user-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  responseSchema: {
    200: responseSchema,
    401: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  logger.info('Fetching current user profile', { userId: user.id })

  return {
    status: 200,
    body: {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    },
  }
}
