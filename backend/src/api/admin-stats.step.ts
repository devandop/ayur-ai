import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  totalUsers: z.number(),
  totalDoctors: z.number(),
  activeDoctors: z.number(),
  totalAppointments: z.number(),
  confirmedAppointments: z.number(),
  completedAppointments: z.number(),
  upcomingAppointments: z.number(),
  todayAppointments: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AdminStats',
  description: 'Get admin dashboard statistics',
  path: '/api/admin/stats',
  method: 'GET',
  emits: [],
  flows: ['admin-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  responseSchema: {
    200: responseSchema,
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  logger.info('Admin fetching dashboard statistics', { adminId: user.id })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Run all queries in parallel for better performance
  const [
    totalUsers,
    totalDoctors,
    activeDoctors,
    totalAppointments,
    confirmedAppointments,
    completedAppointments,
    upcomingAppointments,
    todayAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({
      where: {
        status: 'CONFIRMED',
        date: { gte: now },
      },
    }),
    prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ])

  const stats = {
    totalUsers,
    totalDoctors,
    activeDoctors,
    totalAppointments,
    confirmedAppointments,
    completedAppointments,
    upcomingAppointments,
    todayAppointments,
  }

  logger.info('Admin statistics fetched successfully', {
    adminId: user.id,
    stats,
  })

  return {
    status: 200,
    body: stats,
  }
}
