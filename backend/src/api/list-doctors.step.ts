import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { errorHandlerMiddleware, prisma } from './_shared.step.js'

const responseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  speciality: z.string(),
  bio: z.string().nullable(),
  imageUrl: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  isActive: z.boolean(),
  appointmentCount: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ListDoctors',
  description: 'List all active doctors',
  path: '/api/doctors',
  method: 'GET',
  emits: [],
  flows: ['doctor-management'],
  middleware: [errorHandlerMiddleware],
  responseSchema: {
    200: z.array(responseSchema),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger, state } = ctx

  logger.info('Fetching all doctors')

  // Check cache first (TTL: 60 seconds - doctors change infrequently)
  const cacheKey = 'doctors:list'
  const cached = await state.get(cacheKey)
  if (cached) {
    logger.info('Returning cached doctors list')
    return { status: 200, body: cached }
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const transformedDoctors = doctors.map(doctor => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    speciality: doctor.speciality,
    bio: doctor.bio,
    imageUrl: doctor.imageUrl,
    gender: doctor.gender,
    isActive: doctor.isActive,
    appointmentCount: doctor._count.appointments,
  }))

  // Cache for 60 seconds
  await state.set(cacheKey, transformedDoctors, { ttl: 60 })

  logger.info('Doctors fetched and cached', { count: transformedDoctors.length })

  return {
    status: 200,
    body: transformedDoctors,
  }
}
