import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma, RateLimiters, SanitizationPresets } from './_shared.step.js'

const bodySchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  reason: z.string().optional(),
  duration: z.number().int().positive().optional(),
})

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
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateAppointment',
  description: 'Book a new appointment',
  path: '/api/appointments',
  method: 'POST',
  emits: ['appointment.created'],
  flows: ['appointment-management'],
  middleware: [
    errorHandlerMiddleware,
    clerkAuthMiddleware,
    RateLimiters.moderate, // 30 requests per minute per user
    SanitizationPresets.medicalNotes, // Sanitizes notes/reason fields
  ],
  bodySchema,
  responseSchema: {
    201: responseSchema,
    400: z.object({ error: z.string() }),
    401: z.object({ error: z.string() }),
    429: z.object({ error: z.string(), retryAfter: z.number().optional() }),
    500: z.object({ error: z.string() }),
  },
}

/**
 * Helper function to add a timeout to async operations
 * Prevents indefinite hangs on database queries
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

export const handler: any = async (req, ctx) => {
  const { emit, logger, state } = ctx
  const user = (ctx as any).user

  const { doctorId, date, time, reason, duration } = bodySchema.parse(req.body)

  logger.info('Creating appointment', { userId: user.id, doctorId, date, time, duration })

  // === LAYER 1: State-based lock to prevent race conditions ===
  const lockKey = `booking:lock:${user.id}:${date}:${time}`
  const isLocked = await state.get(lockKey)

  if (isLocked) {
    logger.warn('Booking request already in progress', { userId: user.id, lockKey })
    throw new Error('A booking request is already being processed. Please wait.')
  }

  // Set lock for 30 seconds
  await state.set(lockKey, true, { ttl: 30 })

  try {
    // Verify doctor exists and is active (with 5 second timeout)
    const doctor = await withTimeout(
      prisma.doctor.findUnique({
        where: { id: doctorId },
      }),
      5000
    )

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    if (!doctor.isActive) {
      throw new Error('Doctor is not available for appointments')
    }

    // === LAYER 2: Database validations (run in parallel for performance) ===
    const dateObj = new Date(date)

    // Execute all three checks in parallel instead of sequentially (with 10 second timeout for all)
    const [doctorSlotTaken, duplicateWithSameDoctor, conflictingAppointment] = await withTimeout(
      Promise.all([
      // Check 1: Is this doctor's time slot already taken by ANY patient?
      prisma.appointment.findFirst({
        where: {
          doctorId,
          date: dateObj,
          time,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      }),

      // Check 2: Does THIS user already have an appointment with THIS doctor at this exact time?
      prisma.appointment.findFirst({
        where: {
          userId: user.id,
          doctorId,
          date: dateObj,
          time,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      }),

      // Check 3: Does THIS user have an appointment with ANY doctor at this time?
      prisma.appointment.findFirst({
        where: {
          userId: user.id,
          date: dateObj,
          time,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
        include: {
          doctor: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]),
      10000 // 10 second timeout for all parallel checks
    )

    // Validate results
    if (doctorSlotTaken) {
      logger.warn('Doctor time slot already booked', { doctorId, date, time })
      throw new Error('This time slot is already booked with this doctor. Please choose another time.')
    }

    if (duplicateWithSameDoctor) {
      logger.warn('User already has appointment with this doctor at this time', {
        userId: user.id,
        doctorId,
        date,
        time,
      })
      throw new Error('You already have an appointment with this doctor at this time.')
    }

    if (conflictingAppointment) {
      logger.warn('User already has appointment with different doctor at this time', {
        userId: user.id,
        existingDoctorId: conflictingAppointment.doctorId,
        requestedDoctorId: doctorId,
        date,
        time,
      })
      throw new Error(
        `You already have an appointment with Dr. ${conflictingAppointment.doctor.name} at this time. Please choose a different time slot.`
      )
    }

    // Create appointment (with 5 second timeout)
    const appointment = await withTimeout(
      prisma.appointment.create({
        data: {
          userId: user.id,
          doctorId,
          date: new Date(date),
          time,
          reason: reason || 'General consultation',
          duration: duration || 30, // Use provided duration or default to 30 minutes
          status: 'CONFIRMED',
        },
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
              email: true,
            },
          },
        },
      }),
      5000
    )

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
    }

    // Invalidate user's appointments cache immediately
    await state.delete(`user:${user.id}:appointments`)

    // Fire and forget: Emit event for email notification and analytics
    // Don't await this - let it process asynchronously so the API response returns immediately
    emit({
      topic: 'appointment.created',
      data: {
        appointmentId: appointment.id,
        patientEmail: appointment.user.email,
        patientName: transformedAppointment.patientName,
        doctorName: appointment.doctor.name,
        doctorEmail: appointment.doctor.email,
        date: transformedAppointment.date,
        time: appointment.time,
        reason: appointment.reason || 'General consultation',
      },
    }).catch((err) => {
      // Log error silently - don't let event emission failure affect the response
      logger.error('Failed to emit appointment.created event', { error: err.message, appointmentId: appointment.id })
    })

    logger.info('Appointment created successfully', {
      appointmentId: appointment.id,
      userId: user.id,
      doctorId,
    })

    return {
      status: 201,
      body: transformedAppointment,
    }
  } catch (error: any) {
    // Release lock on error
    await state.delete(lockKey)
    logger.error('Error creating appointment', { error: error.message, userId: user.id })
    throw error
  } finally {
    // Always release lock after processing (success or failure)
    await state.delete(lockKey)
  }
}
