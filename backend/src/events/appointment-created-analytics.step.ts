import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'


const inputSchema = z.object({
  appointmentId: z.string(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  doctorName: z.string(),
  doctorEmail: z.string(),
  date: z.string(),
  time: z.string(),
  reason: z.string(),
})

export const config: EventConfig = {
  type: 'event',
  name: 'AppointmentCreatedAnalytics',
  description: 'Track appointment booking metrics',
  subscribes: ['appointment.created'],
  emits: [],
  input: inputSchema,
  flows: ['analytics'],
}

export const handler = async (
  input: z.infer<typeof inputSchema>,
  { logger }: { logger: { info: (msg: string, meta?: Record<string, any>) => void } }
) => {
  const { appointmentId, patientName, doctorName, date, time, reason } = input

  logger.info('📊 Appointment booking metrics', {
    appointmentId,
    patientName,
    doctorName,
    date,
    time,
    reason,
    timestamp: new Date().toISOString(),
    event: 'appointment.booked',
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
  //   event: 'Appointment Booked',
  //   properties: {
  //     appointmentId,
  //     doctorName,
  //     date,
  //     time,
  //     reason,
  //   },
  // })

  logger.info('Appointment booking metrics logged successfully', {
    appointmentId,
  })
}
