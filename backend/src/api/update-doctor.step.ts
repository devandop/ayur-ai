import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

const bodySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  speciality: z.string().min(1, 'Speciality is required').optional(),
  bio: z.string().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  isActive: z.boolean().optional(),
})

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
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateDoctor',
  description: 'Update doctor details (admin only)',
  path: '/api/doctors/:id',
  method: 'PATCH',
  emits: [],
  flows: ['doctor-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
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
  const { logger, state } = ctx
  const user = (ctx as any).user

  const { id } = req.pathParams
  const data = bodySchema.parse(req.body)

  logger.info('Updating doctor', { adminId: user.id, doctorId: id })

  // Check if doctor exists
  const existingDoctor = await prisma.doctor.findUnique({
    where: { id },
  })

  if (!existingDoctor) {
    throw new Error('Doctor not found')
  }

  // If email is being changed, check for duplicates
  if (data.email && data.email !== existingDoctor.email) {
    const duplicateDoctor = await prisma.doctor.findUnique({
      where: { email: data.email },
    })

    if (duplicateDoctor) {
      throw new Error('A doctor with this email already exists')
    }
  }

  try {
    const doctor = await prisma.doctor.update({
      where: { id },
      data,
    })

    // Invalidate doctors list cache
    await state.delete('doctors:list')

    logger.info('Doctor updated successfully', {
      doctorId: id,
      adminId: user.id,
    })

    return {
      status: 200,
      body: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        speciality: doctor.speciality,
        bio: doctor.bio,
        imageUrl: doctor.imageUrl,
        gender: doctor.gender,
        isActive: doctor.isActive,
        updatedAt: doctor.updatedAt.toISOString(),
      },
    }
  } catch (error: any) {
    // Handle unique constraint violation
    if (error?.code === 'P2002') {
      throw new Error('A doctor with this email already exists')
    }
    throw error
  }
}
