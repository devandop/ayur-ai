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
  createdAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetDoctor',
  description: 'Get doctor details by ID',
  path: '/api/doctors/:id',
  method: 'GET',
  emits: [],
  flows: ['doctor-management'],
  middleware: [errorHandlerMiddleware],
  responseSchema: {
    200: responseSchema,
    404: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams

  logger.info('Fetching doctor details', { doctorId: id })

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  })

  if (!doctor) {
    throw new Error('Doctor not found')
  }

  const transformedDoctor = {
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
    createdAt: doctor.createdAt.toISOString(),
  }

  logger.info('Doctor details fetched successfully', { doctorId: id })

  return {
    status: 200,
    body: transformedDoctor,
  }
}
