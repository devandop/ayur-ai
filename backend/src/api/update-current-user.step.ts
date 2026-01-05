import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma, adminAuthMiddleware, RateLimiters, sanitizationMiddleware } from './_shared.step.js'

const bodySchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().min(1, 'Phone cannot be empty').optional(),
})

const responseSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateCurrentUser',
  description: 'Update current user profile',
  path: '/api/users/me',
  method: 'PATCH',
  emits: [],
  flows: ['user-management'],
  middleware: [
    errorHandlerMiddleware,
    clerkAuthMiddleware,
    RateLimiters.moderate, // 30 requests per minute per user
    sanitizationMiddleware({
      stripHTML: true,
      maxLength: 100,
      fieldsToStrip: ['firstName', 'lastName', 'phone'],
    }),
  ],
  bodySchema,
  responseSchema: {
    200: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    429: z.object({ error: z.string(), retryAfter: z.number().optional() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req: { body: unknown }, ctx: { logger: any }) => {
  const { logger } = ctx
  const user = (ctx as any).user

  const data = bodySchema.parse(req.body)

  logger.info('Updating user profile', { userId: user.id })

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
  })

  logger.info('User profile updated successfully', { userId: user.id })

  return {
    status: 200,
    body: {
      id: updatedUser.id,
      clerkId: updatedUser.clerkId,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      updatedAt: updatedUser.updatedAt.toISOString(),
    },
  }
}
