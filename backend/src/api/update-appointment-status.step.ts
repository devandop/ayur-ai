import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const bodySchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED']),
})

const responseSchema = z.object({
  id: z.string(),
  status: z.enum(['CONFIRMED', 'COMPLETED']),
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateAppointmentStatus',
  description: 'Update appointment status (CONFIRMED/COMPLETED)',
  path: '/api/appointments/:id/status',
  method: 'PATCH',
  emits: [
    {
      topic: 'appointment.updated',
      conditional: true,
    },
    {
      topic: 'appointment.completed',
      conditional: true,
    },
  ],
  flows: ['appointment-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware],
  bodySchema,
  responseSchema: {
    200: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { emit, logger, state } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams
  const { status } = bodySchema.parse(req.body)

  logger.info('Updating appointment status', { appointmentId: id, status, userId: user.id })

  // Check if user is admin
  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = adminEmail && user.email === adminEmail

  // Check appointment exists and user owns it
  const existingAppointment = await prisma.appointment.findUnique({
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
          email: true,
        },
      },
    },
  })

  if (!existingAppointment) {
    throw new Error('Appointment not found')
  }

  // Allow if user owns the appointment OR user is admin
  if (existingAppointment.userId !== user.id && !isAdmin) {
    throw new Error('Forbidden - You do not have permission to update this appointment')
  }

  if (isAdmin && existingAppointment.userId !== user.id) {
    logger.info('Admin updating another user\'s appointment', {
      adminId: user.id,
      appointmentOwnerId: existingAppointment.userId
    })
  }

  // Update appointment status
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  })

  const patientName = `${existingAppointment.user.firstName || ''} ${existingAppointment.user.lastName || ''}`.trim()

  // Emit appropriate event based on status
  if (status === 'COMPLETED') {
    await emit({
      topic: 'appointment.completed',
      data: {
        appointmentId: appointment.id,
        patientEmail: existingAppointment.user.email,
        patientName,
        doctorName: existingAppointment.doctor.name,
        date: existingAppointment.date.toISOString().split('T')[0],
        time: existingAppointment.time,
      },
    })

    logger.info('Appointment marked as completed', { appointmentId: id })
  } else {
    await emit({
      topic: 'appointment.updated',
      data: {
        appointmentId: appointment.id,
        patientEmail: existingAppointment.user.email,
        patientName,
        doctorName: existingAppointment.doctor.name,
        doctorEmail: existingAppointment.doctor.email,
        date: existingAppointment.date.toISOString().split('T')[0],
        time: existingAppointment.time,
        status: appointment.status,
      },
    })

    logger.info('Appointment updated', { appointmentId: id, newStatus: status })
  }

  // Invalidate appointment owner's cache
  await state.delete(`user:${existingAppointment.userId}:appointments`)

  return {
    status: 200,
    body: {
      id: appointment.id,
      status: appointment.status,
      updatedAt: appointment.updatedAt.toISOString(),
    },
  }
}
