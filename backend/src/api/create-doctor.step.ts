import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { adminAuthMiddleware, clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'

// Helper function to generate avatar (matching existing code pattern)
function generateAvatar(name: string, gender: string): string {
  const seed = encodeURIComponent(name)
  const style = gender === 'FEMALE' ? 'avataaars' : 'micah'
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
}

const bodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  speciality: z.string().min(1, 'Speciality is required'),
  bio: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  isActive: z.boolean().default(true),
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
  createdAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateDoctor',
  description: 'Create a new doctor (admin only)',
  path: '/api/doctors',
  method: 'POST',
  emits: [],
  flows: ['doctor-management'],
  middleware: [errorHandlerMiddleware, clerkAuthMiddleware, adminAuthMiddleware],
  bodySchema,
  responseSchema: {
    201: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    403: z.object({ error: z.string() }),
    500: z.object({ error: z.string() }),
  },
}

export const handler: any = async (req, ctx) => {
  const { logger, state } = ctx
  const user = (ctx as any).user

  const data = bodySchema.parse(req.body)

  logger.info('Creating doctor', { adminId: user.id, doctorEmail: data.email })

  try {
    const doctor = await prisma.doctor.create({
      data: {
        ...data,
        imageUrl: generateAvatar(data.name, data.gender),
      },
    })

    // Invalidate doctors list cache
    await state.delete('doctors:list')

    logger.info('Doctor created successfully', {
      doctorId: doctor.id,
      adminId: user.id,
    })

    return {
      status: 201,
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
        createdAt: doctor.createdAt.toISOString(),
      },
    }
  } catch (error: any) {
    // Handle unique constraint violation (email already exists)
    if (error?.code === 'P2002') {
      throw new Error('A doctor with this email already exists')
    }
    throw error
  }
}
