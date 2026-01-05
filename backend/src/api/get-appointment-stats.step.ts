import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  totalAppointments: z.number(),
  completedAppointments: z.number(),
  upcomingAppointments: z.number(),
  completionRate: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetAppointmentStats',
  description: 'Get user appointment statistics',
  path: '/api/appointments/stats',
  method: 'GET',
  emits: [],
  flows: ['appointment-management'],
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

  logger.info('Fetching appointment statistics', { userId: user.id })

  const now = new Date()

  // Run queries in parallel for better performance
  const [totalCount, completedCount, upcomingCount] = await Promise.all([
    prisma.appointment.count({
      where: { userId: user.id },
    }),
    prisma.appointment.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        userId: user.id,
        status: 'CONFIRMED',
        date: {
          gte: now,
        },
      },
    }),
  ])

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  logger.info('Appointment statistics fetched successfully', {
    userId: user.id,
    totalCount,
    completedCount,
    upcomingCount,
  })

  return {
    status: 200,
    body: {
      totalAppointments: totalCount,
      completedAppointments: completedCount,
      upcomingAppointments: upcomingCount,
      completionRate,
    },
  }
}
