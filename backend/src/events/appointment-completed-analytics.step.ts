import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'


const inputSchema = z.object({
  appointmentId: z.string(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  doctorName: z.string(),
  date: z.string(),
  time: z.string(),
})

export const config: EventConfig = {
  type: 'event',
  name: 'AppointmentCompletedAnalytics',
  description: 'Track appointment completion metrics',
  subscribes: ['appointment.completed'],
  emits: [],
  input: inputSchema,
  flows: ['analytics'],
}

export const handler: import('motia').EventHandler<
  z.infer<typeof inputSchema>,
  typeof config
> = async (input: z.infer<typeof inputSchema>, { logger }: { logger: import('motia').Logger }) => {
  const { appointmentId, patientName, doctorName, date, time } = input

  logger.info('📊 Appointment completion metrics', {
    appointmentId,
    patientName,
    doctorName,
    date,
    time,
    timestamp: new Date().toISOString(),
    event: 'appointment.completed',
  })

  // In production, you would send this to analytics services like:
  // - Google Analytics
  // - Mixpanel
  // - Segment
  // - PostHog
  // - Custom analytics dashboard

  // Example (commented out):
  // await analytics.track({
  //   userId: input.patientEmail,
  //   event: 'Appointment Completed',
  //   properties: {
  //     appointmentId,
  //     doctorName,
  //     date,
  //     time,
  //   },
  // })

  logger.info('Appointment completion metrics logged successfully', {
    appointmentId,
  })
}
