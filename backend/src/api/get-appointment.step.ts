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
  name: 'GetAppointment',
  description: 'Get a single appointment by ID',
  path: '/api/appointments/:id',
  method: 'GET',
  emits: [],
  flows: ['appointment-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
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
  const user = (ctx as any).user

  const { id } = req.pathParams

  logger.info('Fetching appointment', { appointmentId: id, userId: user.id })

  const appointment = await prisma.appointment.findUnique({
    where: { id },
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
  })

  if (!appointment) {
    throw new Error('Appointment not found')
  }

  // Verify user owns this appointment
  if (appointment.userId !== user.id) {
    throw new Error('Forbidden - You do not have permission to view this appointment')
  }

  const transformedAppointment = {
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
  }

  logger.info('Appointment fetched successfully', { appointmentId: id })

  return {
    status: 200,
    body: transformedAppointment,
  }
}
