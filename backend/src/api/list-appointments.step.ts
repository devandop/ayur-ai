import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.number(),
  status: z.enum(['CONFIRMED', 'COMPLETED']),
  notes: z.string().nullable(),
  reason: z.string().nullable(),
  patientName: z.string(),
  patientEmail: z.string(),
  doctorName: z.string(),
  doctorImageUrl: z.string(),
  createdAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ListUserAppointments',
  description: 'List all appointments for the authenticated user',
  path: '/api/appointments',
  method: 'GET',
  emits: [],
  flows: ['appointment-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  responseSchema: {
    200: z.array(responseSchema),
    401: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: Handlers['ListUserAppointments'] = async (req, ctx) => {
  const { logger, state } = ctx
  const user = (ctx as any).user

  logger.info('Fetching user appointments', { userId: user.id })

  // Check cache first (TTL: 30 seconds)
  const cacheKey = `user:${user.id}:appointments`
  const cached = await state.get(cacheKey)
  if (cached) {
    logger.info('Returning cached appointments', { userId: user.id })
    return { status: 200, body: cached }
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      doctor: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  const transformedAppointments = appointments.map(appointment => ({
    id: appointment.id,
    date: appointment.date.toISOString().split('T')[0],
    time: appointment.time,
    duration: appointment.duration,
    status: appointment.status,
    notes: appointment.notes,
    reason: appointment.reason,
    patientName: `${appointment.user.firstName || ''} ${appointment.user.lastName || ''}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl,
    createdAt: appointment.createdAt.toISOString(),
  }))

  // Cache for 30 seconds
  await state.set(cacheKey, transformedAppointments, { ttl: 30 })

  logger.info('User appointments fetched and cached', {
    userId: user.id,
    count: transformedAppointments.length,
  })

  return {
    status: 200,
    body: transformedAppointments,
  }
}
