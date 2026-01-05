import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

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
  name: 'AdminListAppointments',
  description: 'List all appointments with optional filters (admin only)',
  path: '/api/admin/appointments',
  method: 'GET',
  emits: [],
  flows: ['admin-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  queryParams: [
    {
      name: 'status',
      description: 'Filter by status: CONFIRMED or COMPLETED',
    },
    {
      name: 'doctorId',
      description: 'Filter by doctor ID',
    },
    {
      name: 'from',
      description: 'Filter appointments from date (YYYY-MM-DD)',
    },
    {
      name: 'to',
      description: 'Filter appointments to date (YYYY-MM-DD)',
    },
  ],
  responseSchema: {
    200: z.array(responseSchema),
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  const { status, doctorId, from, to } = req.queryParams

  logger.info('Admin fetching appointments', {
    adminId: user.id,
    filters: { status, doctorId, from, to },
  })

  // Build filter object
  const where: any = {}

  if (status) {
    where.status = status
  }

  if (doctorId) {
    where.doctorId = doctorId
  }

  if (from || to) {
    where.date = {}
    if (from) {
      where.date.gte = new Date(from as string)
    }
    if (to) {
      where.date.lte = new Date(to as string)
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
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
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  })

  const transformedAppointments = appointments.map((appointment: any) => ({
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

  logger.info('Admin appointments fetched successfully', {
    adminId: user.id,
    count: transformedAppointments.length,
  })

  return {
    status: 200,
    body: transformedAppointments,
  }
}
