import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  bookedSlots: z.array(z.string()),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetDoctorAvailability',
  description: 'Get booked time slots for a doctor on a specific date',
  path: '/api/doctors/:id/availability',
  method: 'GET',
  emits: [],
  flows: ['doctor-management'],
  middleware: [errorHandlerMiddleware],
  queryParams: [
    {
      name: 'date',
      description: 'Date in YYYY-MM-DD format',
    },
  ],
  responseSchema: {
    200: responseSchema,
    400: z.object({ error: z.string() }),
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams
  const date = req.queryParams.date as string

  if (!date) {
    throw new Error('Date query parameter is required')
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    throw new Error('Date must be in YYYY-MM-DD format')
  }

  logger.info('Fetching doctor availability', { doctorId: id, date })

  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id },
  })

  if (!doctor) {
    throw new Error('Doctor not found')
  }

  // Fetch booked time slots
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: id,
      date: new Date(date),
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
    },
    select: { time: true },
    orderBy: { time: 'asc' },
  })

  const bookedSlots = appointments.map(appointment => appointment.time)

  logger.info('Doctor availability fetched successfully', {
    doctorId: id,
    date,
    bookedSlotsCount: bookedSlots.length,
  })

  return {
    status: 200,
    body: {
      doctorId: id,
      date,
      bookedSlots,
    },
  }
}
