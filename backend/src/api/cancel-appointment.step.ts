import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CancelAppointment',
  description: 'Cancel an appointment (soft delete)',
  path: '/api/appointments/:id',
  method: 'DELETE',
  emits: ['appointment.cancelled'],
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
  const { emit, logger, state } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams

  logger.info('Cancelling appointment', { appointmentId: id, userId: user.id })

  // Check appointment exists and user owns it
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
          email: true,
        },
      },
    },
  })

  if (!appointment) {
    throw new Error('Appointment not found')
  }

  if (appointment.userId !== user.id) {
    throw new Error('Forbidden - You do not have permission to cancel this appointment')
  }

  // Delete appointment
  await prisma.appointment.delete({
    where: { id },
  })

  const patientName = `${appointment.user.firstName || ''} ${appointment.user.lastName || ''}`.trim()

  // Emit cancellation event for email notification
  await emit({
    topic: 'appointment.cancelled',
    data: {
      appointmentId: id,
      patientEmail: appointment.user.email,
      patientName,
      doctorName: appointment.doctor.name,
      doctorEmail: appointment.doctor.email,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      reason: appointment.reason || 'General consultation',
    },
  })

  // Invalidate user's appointments cache
  await state.delete(`user:${user.id}:appointments`)

  logger.info('Appointment cancelled successfully', { appointmentId: id })

  return {
    status: 200,
    body: {
      success: true,
      message: 'Appointment cancelled successfully',
    },
  }
}
